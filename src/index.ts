import fastpixMetrix from "@fastpix/video-data-core";

import { attachAdTracking } from "./AdTracking/index";

import type {
  CoreInterface,
  EventsInterface,
  VariantTrack,
  VideoPlayer,
} from "./DataTypes/index";

// List of core player events to listen for.
const coreEvents: string[] = [
  "pause",
  "play",
  "playing",
  "seeking",
  "seeked",
  "timeupdate",
  "stalled",
  "waiting",
  "ended",
];

// Shaka request types with corresponding numeric codes.
const shakaRequestType: Record<number, string> = {
  0: "manifest",
  1: "media",
  6: "encryption",
};

// Fetch a specific parameter from the video element.
function fetchVideoParam(player: VideoPlayer, param: string): any {
  if (!player) return undefined;
  const mediaElement: HTMLMediaElement | null = player.getMediaElement();

  // @ts-ignore
  return mediaElement ? mediaElement[param] : undefined;
}

// Determine if the preload type for the video is valid (auto or metadata).
function determinePreloadType(player: VideoPlayer): boolean {
  const validPreloadSettings = new Set(["auto", "metadata"]);
  if (!player) {
    return false;
  }

  const preloadSetting = fetchVideoParam(player, "preload");

  if (!preloadSetting) {
    return false;
  }

  return validPreloadSettings.has(preloadSetting);
}

// Determine if the player is currently in fullscreen mode.
function isFullScreenElement(player: VideoPlayer): boolean {
  const documentRef: any = window?.document;

  if (!documentRef || !player) {
    return false;
  }

  const fullscreenElement =
    documentRef.fullscreenElement ??
    documentRef.webkitFullscreenElement ??
    documentRef.mozFullScreenElement ??
    documentRef.msFullscreenElement;

  return fullscreenElement === player.getMediaElement();
}

// Create a callback function for handling events on the media element.
function createEventCallback(
  player: VideoPlayer,
  instance: CoreInterface,
  eventName: string,
): EventListener {
  return () => {
    const mediaElement = player.getMediaElement();
    const view: any = {};

    if (!mediaElement) {
      return;
    }

    if (eventName === "timeupdate") {
      view.player_playhead_time = instance.utilityMethods.convertSecToMs(
        mediaElement.currentTime,
      );
    }
    player.fp.dispatch(eventName, view);
  };
}

// Attach event listeners to the media element for core events.
function attachMediaElementEvents(
  player: VideoPlayer,
  instance: CoreInterface,
): Record<string, EventListener> {
  const videoContainer = player.getMediaElement();
  const callbacks: Record<string, EventListener> = {};

  if (!videoContainer) {
    console.warn(
      "Error occurred with getMediaElement() on the shaka.Player instance while attempting to attach media element events during the attachMediaElementEvents() process.",
    );
    return {};
  }

  coreEvents.forEach((eventName) => {
    const callback = createEventCallback(player, instance, eventName);
    videoContainer.addEventListener(eventName, callback, false);
    callbacks[eventName] = callback;
  });

  return callbacks;
}

// Shaka derives audioBandwidth itself where it can: the audio stream's own
// declared rate, or the variant rate less the video rate when only that is
// known. Both are better than anything the adapter could work out, so the
// track is asked first.
//
// It stays null when neither is available - HLS carries no BANDWIDTH on
// EXT-X-MEDIA, so an audio-only rendition group often declares nothing. The
// manifest is the fallback for that case; a DASH Representation does carry
// @bandwidth even when the track was built without it.
function fetchAudioBitrate(
  player: VideoPlayer,
  track?: VariantTrack,
): number | undefined {
  if (track?.audioBandwidth) {
    return track.audioBandwidth;
  }

  if (track?.id === undefined) return undefined;
  const variants = player.getManifest?.()?.variants;

  return variants?.find((variant) => variant.id === track.id)?.audio?.bandwidth;
}

// A stream that declares no program date time still gets a Date back from
// Shaka. getPlayheadTimeAsDate falls back to the presentation start time,
// which is 0 for VOD, so the playhead is returned anchored at the Unix epoch -
// a playhead at 190 seconds becomes 1970-01-01T00:03:10Z, which is not a wall
// clock and must not be reported as one.
//
// A real program date time is a calendar date, so anything at or before the
// floor below is the epoch-anchored fallback rather than a declared time.
const PROGRAM_DATE_TIME_FLOOR = Date.UTC(2000, 0, 1);

function readProgramDateTime(player: VideoPlayer): number | undefined {
  const programDate = player.getPlayheadTimeAsDate?.()?.getTime();

  if (programDate === undefined || programDate <= PROGRAM_DATE_TIME_FLOOR) {
    return undefined;
  }

  return programDate;
}

// Update the video attributes and dispatch an event if they change.
function updateVideoAttributes(
  player: VideoPlayer,
  previousAttributes: Record<string, any>,
): Record<string, any> {
  // Shaka pairs video with audio in a single variant track, so every field
  // below is read off the same object and one beacon can never describe two
  // different renditions.
  const activeItem = player.getVariantTracks()?.find((tab) => tab.active);
  const currentAttributes = {
    // Already inclusive of audio. Adding audioBandwidth would count it twice.
    video_source_bitrate: activeItem?.bandwidth,
    video_source_codec: activeItem?.videoCodec,
    video_source_fps: activeItem?.frameRate,
    video_source_width: activeItem?.width,
    video_source_height: activeItem?.height,
    video_source_audio_codec: activeItem?.audioCodec,
    video_source_audio_bitrate: fetchAudioBitrate(player, activeItem),
    // Shaka reports "SDR" / "PQ" / "HLG", the same vocabulary the HLS path
    // takes from VIDEO-RANGE, so it is passed through unmapped.
    video_source_dynamic_range_type: activeItem?.hdr,
    video_source_rendition_name:
      fastpixMetrix.utilityMethods.buildRenditionName(
        activeItem?.width,
        activeItem?.height,
        activeItem?.hdr,
      ),
  };

  if (
    !activeItem ||
    JSON.stringify(currentAttributes) === JSON.stringify(previousAttributes)
  ) {
    return previousAttributes;
  }

  player.fp.dispatch("variantChanged", currentAttributes);
  return currentAttributes;
}

// Register networking filters to monitor network requests.
function registerNetworkingFilters(
  player: VideoPlayer,
  instance: CoreInterface,
) {
  player
    .getNetworkingEngine()
    .registerResponseFilter((requestType: any, options) => {
      if (options.fromCache) return;
      const currentTime = instance.utilityMethods.now();
      const requestOrder = shakaRequestType[requestType.toString()];
      if (requestOrder) {
        const shakaPlayerRequestCompleted = {
          request_bytes_loaded: options.data.byteLength,
          request_hostname: instance.utilityMethods.fetchHost(options.uri),
          request_url: options.uri,
          request_response_headers: options.headers,
          request_type: requestOrder,
          request_start: options.timeMs
            ? currentTime - options.timeMs
            : undefined,
          request_response_end: currentTime,
        };
        player.fp.dispatch("requestCompleted", shakaPlayerRequestCompleted);
      }
    });
}

// Extract error message from the error object.
function getErrorMessage(err: any, shakaElement: any): string {
  const utilError = shakaElement?.util?.Error?.Code ?? {};
  const codeName = Object.keys(utilError).find(
    (key) => utilError[key] === err.code,
  );

  if (codeName) {
    return codeName;
  }

  if (err.message) {
    return err.message;
  }

  if (err?.code) {
    return err.code.toString();
  }

  return "";
}

function logError(player: VideoPlayer, err: any, shakaElement: any) {
  if (err.severity === 2 && err?.code) {
    player.fp.dispatch("error", {
      player_error_code: err.code,
      player_error_message: getErrorMessage(err, shakaElement),
      player_error_context: err.data?.toString(),
    });
  }
}

// Handle automatic error tracking by logging errors when they occur.
function handleAutomaticErrorTracking(
  player: VideoPlayer,
  event: Event,
  options: EventsInterface,
  shaka: any,
) {
  if (options.automaticErrorTracking) {
    const errorDetail = (event as CustomEvent).detail;
    logError(player, errorDetail, shaka);
  }
}

function loadShakaPlayer(
  player: VideoPlayer,
  options: EventsInterface,
  shaka: any = (window as any).shaka ?? (globalThis as any).shaka,
) {
  const errorTracking = {
    automaticErrorTracking: options.automaticErrorTracking ?? true,
  };

  if (
    !player ||
    typeof player !== "object" ||
    player?.constructor?.version === undefined
  ) {
    if (errorTracking?.automaticErrorTracking) {
      console.warn(
        "A valid Shaka Player instance is required to enable data analytics tracking. " +
          "Please ensure that the provided instance is properly configured.",
      );
      return {
        dispatch: function () {
          console.warn(
            "'dispatch' is unavailable because 'loadShakaPlayer' was not initialized with a valid Shaka Player instance.",
          );
        },
        handleLoadError: function () {
          console.warn(
            "'handleLoadError' is unavailable because 'loadShakaPlayer' was not initialized with a valid Shaka Player instance.",
          );
        },
      };
    }
  }

  if (player?.fp) {
    player.fp.destroy();
  }

  const playerToken = fastpixMetrix.utilityMethods.generateIdToken();

  // Read once, at the first state read that finds a media element - Shaka may
  // not have attached one at setup. Chrome's native speed control writes
  // defaultPlaybackRate alongside playbackRate, so re-reading it every beacon
  // would report the viewer's choice as the application's default and the two
  // fields could never disagree. Left absent until the element exists, rather
  // than defaulted to 1, so a missing element is not reported as a real value.
  let configuredPlaybackRate: number | undefined;

  function readDefaultPlaybackRate(
    mediaElement: HTMLMediaElement | null,
  ): number | undefined {
    if (configuredPlaybackRate === undefined && mediaElement) {
      configuredPlaybackRate = mediaElement.defaultPlaybackRate;
    }

    return configuredPlaybackRate;
  }

  // Shaka attaches its media element asynchronously, so the observer is created
  // on first use rather than here, where the element is often still absent.
  let viewability: ReturnType<
    typeof fastpixMetrix.utilityMethods.observeViewability
  > | null = null;

  function readViewability(mediaElement: HTMLMediaElement | null) {
    if (!viewability && mediaElement) {
      viewability =
        fastpixMetrix.utilityMethods.observeViewability(mediaElement);
    }

    return (
      viewability?.readState() ?? {
        player_viewable_on: undefined,
        player_viewable_percentage: undefined,
      }
    );
  }

  // Fetch the current playhead time of the video player.
  function fetchPlayheadTime(player: VideoPlayer): number {
    if (!player) return 0;
    const mediaElement = player.getMediaElement();
    return mediaElement ? Math.floor(mediaElement.currentTime * 1000) : 0;
  }

  // Fetch the state of the video player.
  function fetchStateData(player: VideoPlayer): Record<string, any> {
    if (!player) return {};
    const { height, width, droppedFrames } = player.getStats();
    const fetchParam = (param: string) => fetchVideoParam(player, param);
    const mediaElement = player.getMediaElement();

    // Shaka drives a plain <video> underneath, so the element carries the
    // viewer's own settings - mute, volume, speed - which the Player API does
    // not surface. Everything below reads straight off it.
    const textTracks = mediaElement?.textTracks;
    const activeTextTrack = textTracks
      ? Array.prototype.find.call(
          textTracks,
          (track: TextTrack) => track.mode === "showing",
        )
      : undefined;
    // Shaka reports "und" for a manifest that declares no audio language.
    // Sent as empty rather than passing the placeholder through.
    const audioLanguage = player
      .getVariantTracks?.()
      ?.find((variant: any) => variant.active)?.language;

    return {
      player_is_paused: fetchParam("paused"),
      player_width: fetchParam("offsetWidth"),
      player_height: fetchParam("offsetHeight"),
      video_source_height: height,
      video_source_width: width,
      player_autoplay_on: fetchParam("autoplay"),
      player_preload_on: determinePreloadType(player),
      player_is_fullscreen: isFullScreenElement(player),
      video_source_url: player.getAssetUri(),
      video_source_duration: Math.floor(fetchParam("duration") * 1000),
      view_dropped_frame_count: droppedFrames,
      video_poster_url: fetchParam("poster"),
      player_language_code: fetchParam("lang"),

      // ── Viewer-controlled player state ──────────────────────────────
      player_muted: fetchParam("muted"),
      // The initial value, not the current one - it must not follow the
      // mute button, or the pair says nothing.
      player_default_muted_on: fetchParam("defaultMuted"),
      // 0 to 1, not 0 to 100
      player_volume_level: fetchParam("volume"),
      player_playback_rate: fetchParam("playbackRate"),
      player_default_playback_rate: readDefaultPlaybackRate(mediaElement),
      player_loop_on: fetchParam("loop"),
      player_controls_on: fetchParam("controls"),

      // ── Tracks ──────────────────────────────────────────────────────
      player_subtitles_on: !!activeTextTrack,
      player_subtitles_language_code: activeTextTrack?.language,
      player_audio_language_code: audioLanguage === "und" ? "" : audioLanguage,

      // ── Presentation ────────────────────────────────────────────────
      player_is_pip:
        typeof document !== "undefined" &&
        document.pictureInPictureElement === mediaElement,

      // ── Delivery ────────────────────────────────────────────────────
      // Taken from the manifest URI, not the media element: Shaka plays
      // through MSE, so currentSrc is a blob: URL that names nothing.
      video_source_stream_protocol:
        fastpixMetrix.utilityMethods.identifyStreamingProtocol(
          player.getAssetUri(),
        ),
      video_source_buffer_length: mediaElement
        ? fastpixMetrix.utilityMethods.measureBufferLength(mediaElement)
        : undefined,
      player_program_date_time: readProgramDateTime(player),

      ...readViewability(mediaElement),
    };
  }

  player.fp = player.fp ?? {};

  player.fp = {
    dispatch: (eventName, data) =>
      fastpixMetrix.dispatch(playerToken, eventName, data),
    destroy: () => {},
  };

  options = { ...errorTracking, ...options };
  options.fetchStateData = () => fetchStateData(player);
  options.fetchPlayheadTime = () => fetchPlayheadTime(player);
  options.data = {
    ...options.data,
    player_software_name: "Shaka Player",
    player_software_version: player?.constructor?.version,
    player_fastpix_sdk_name: "fastpix-shakaplayer-monitoring",
    player_fastpix_sdk_version: "1.0.3",
  };

  let isVideoLoaded = false;
  let defVariantEvents: any = {
    video_source_bitrate: undefined,
    video_source_codec: undefined,
    video_source_fps: undefined,
    video_source_width: undefined,
    video_source_height: undefined,
    video_source_audio_codec: undefined,
    video_source_audio_bitrate: undefined,
    video_source_dynamic_range_type: undefined,
    video_source_rendition_name: undefined,
  };

  const memory: Record<string, EventListener> = {
    onstatechange: (data: any) => {
      if (!isVideoLoaded && player.getMediaElement()) {
        isVideoLoaded = true;
        attachMediaElementEvents(player, fastpixMetrix);
      }
      if (data.state === "load") {
        player.fp.dispatch("playerReady");
      }
    },
    adaptation: () => {
      defVariantEvents = updateVideoAttributes(player, defVariantEvents);
    },
    variantchanged: () => {
      defVariantEvents = updateVideoAttributes(player, defVariantEvents);
    },
    error: (event: Event) =>
      handleAutomaticErrorTracking(player, event, options, shaka),
  };

  player.addEventListener("onstatechange", memory.onstatechange);
  player.addEventListener("adaptation", memory.adaptation);
  player.addEventListener("variantchanged", memory.variantchanged);

  if (errorTracking?.automaticErrorTracking) {
    player.addEventListener("error", memory.error);
  }

  registerNetworkingFilters(player, fastpixMetrix);

  // Returns a no-op unless the integrator started one of Shaka's ad managers,
  // so a player with no ads pays nothing for this.
  const detachAdTracking = attachAdTracking(player, fastpixMetrix);

  player.fp.destroy = () => {
    Object?.entries(memory).forEach(([eventName, listener]) => {
      player.removeEventListener(eventName, listener);
      delete memory[eventName];
    });

    const callbacks = attachMediaElementEvents(player, fastpixMetrix);
    Object?.entries(callbacks).forEach(([eventName, listener]) => {
      const mediaElement = player.getMediaElement();
      if (mediaElement) {
        mediaElement.removeEventListener(eventName, listener, false);
      }
    });

    detachAdTracking();

    viewability?.disconnect();
    viewability = null;

    player.fp.dispatch("destroy");

    if (player?.fp) {
      delete (player as any)?.fp;
    }
  };

  fastpixMetrix.configure(playerToken, options);

  return {
    dispatch: player.fp.dispatch,
    handleLoadError: (err: any) => {
      if (errorTracking?.automaticErrorTracking) {
        logError(player, err, shaka);
      }
    },
  };
}

loadShakaPlayer.utilityMethods = fastpixMetrix.utilityMethods;

export default loadShakaPlayer;

if (typeof window !== "undefined") {
  (window as any).loadShakaPlayer = loadShakaPlayer;
}
