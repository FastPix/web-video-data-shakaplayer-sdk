import fastpixMetrix from "@fastpix/video-data-core";

import type {
  CoreInterface,
  EventsInterface,
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

// Update the video attributes and dispatch an event if they change.
function updateVideoAttributes(
  player: VideoPlayer,
  previousAttributes: Record<string, any>,
): Record<string, any> {
  const activeItem = player.getVariantTracks()?.find((tab) => tab.active);
  const currentAttributes = {
    video_source_bitrate: activeItem?.bandwidth,
    video_source_codec: activeItem?.videoCodec,
    video_source_fps: activeItem?.frameRate,
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
