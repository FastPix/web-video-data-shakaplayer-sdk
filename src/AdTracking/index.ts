import type { CoreInterface, ShakaAd, VideoPlayer } from "../DataTypes/index";

// Shaka's ad event names are plain strings and have been byte-identical since
// 4.9. The constants naming them are not: they lived on shaka.ads.AdManager
// until 4.11 added shaka.ads.Utils, so reading either off the namespace ties
// the adapter to a version range. The strings do not, and an event Shaka never
// fires simply never arrives.
const AD_EVENTS = {
  started: "ad-started",
  impression: "ad-impression",
  complete: "ad-complete",
  stopped: "ad-stopped",
  skipped: "ad-skipped",
  error: "ad-error",
  allCompleted: "all-ads-completed",
  loaded: "ads-loaded",
  cuepoints: "ad-cue-points-changed",
  breakEnded: "ad-break-ended",
  contentResume: "ad-content-resume-requested",

  // A quarter of the way in, so the ad's media has certainly loaded. Shaka
  // reports an interstitial's duration as -1 until then, and never sends
  // ad-duration-changed for this path, so this is the point at which the real
  // length can be read.
  firstQuartile: "ad-first-quartile",
} as const;

// IMA reports a preroll as offset 0 and a postroll as a negative offset, which
// is a sentinel rather than a position - a postroll is not at second minus one.
//
// Shaka's DASH interstitial parser hardcodes pre and post to false, so a DASH
// postroll arrives with a real positive offset and no flag to distinguish it
// from a midroll. Comparing against the content duration is the only thing left
// that can tell them apart, and a break starting at or past the end of the
// content is a postroll whatever the manifest called it.
function describeBreakPosition(
  timeOffset?: number,
  contentDuration?: number,
): string {
  if (timeOffset === undefined || timeOffset === 0) {
    return "preroll";
  }

  if (timeOffset < 0) {
    return "postroll";
  }

  // Scaled to the content rather than a fixed margin. A break is placed at the
  // end by intent, not by frame accuracy - a postroll on a three minute asset
  // is commonly signalled a few seconds short of the last frame, and a one
  // second window called that a midroll. Two percent puts the boundary at about
  // four seconds here and twelve on a ten minute asset, with a one second floor
  // so a very short clip does not treat its whole tail as a postroll.
  //
  // Absent or non-finite duration falls through to midroll rather than guessing,
  // which is the case for every live stream.
  if (typeof contentDuration === "number" && Number.isFinite(contentDuration)) {
    const tailStart = contentDuration - Math.max(1, contentDuration * 0.02);

    if (timeOffset >= tailStart) {
      return "postroll";
    }
  }

  return "midroll";
}

// Only a real, non-negative offset belongs on the content timeline. The
// postroll sentinel is dropped rather than reported as a negative time.
function describeTimeOffset(
  instance: CoreInterface,
  timeOffset?: number,
): number | undefined {
  if (timeOffset === undefined || timeOffset < 0) {
    return undefined;
  }

  return instance.utilityMethods.convertSecToMs(timeOffset);
}

// Shaka's AbstractAd returns "" rather than null for metadata an ad type does
// not carry, and every ad inherits those defaults unless its own class
// overrides them. Passed through as-is they would send empty strings for
// fields that are simply not knowable, which reads downstream as "measured and
// blank" rather than "not reported".
function orAbsent(value?: string | null): string | undefined {
  return value || undefined;
}

// Number.isFinite carries the weight here rather than the comparison. A bare
// `seconds <= 0` would let NaN through - NaN <= 0 is false - and report a
// duration of NaN milliseconds. It also rejects Infinity, which a live
// presentation reports for duration and which the comparison would accept.
function toMilliseconds(
  instance: CoreInterface,
  seconds?: number,
): number | undefined {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return undefined;
  }

  return instance.utilityMethods.convertSecToMs(seconds);
}

// Every handler runs inside this. A shape the adapter did not anticipate costs
// the ad fields for that event and nothing else - content metrics, and the rest
// of the ad break, carry on.
function guard(handler: (event: any) => void): EventListener {
  return (event: any) => {
    try {
      handler(event);
    } catch {
      // Deliberately silent. An ad payload the adapter cannot read is not worth
      // interrupting playback monitoring over.
    }
  };
}

export function attachAdTracking(
  player: VideoPlayer,
  instance: CoreInterface,
): () => void {
  const adManager = player.getAdManager?.();

  // Ads are opt-in: nothing arrives unless the integrator started one of
  // Shaka's ad managers themselves. An absent manager is the ordinary case,
  // not a failure.
  if (!adManager?.addEventListener) {
    return () => {};
  }

  // Shaka exposes a pod index and a position within it, but no stable break
  // identifier. The pair below is constant for the life of a break and unique
  // against every other break in the view, which is what the identifier is for.
  //
  // The time offset is doing most of the work. Only the two IMA ad types
  // override getPodIndex - interstitials and MediaTailor inherit AbstractAd's
  // hardcoded 0 - so on those paths the offset is the only thing telling one
  // break from another. Two breaks cannot share a start time, so it holds.
  let openBreakId: string | undefined;
  let openBreakDuration: number | undefined;

  // Armed when an ad starts and disarmed when it ends or fails, so only an
  // impression raised while an ad is actually on screen is forwarded.
  let impressionPending = false;

  // Kept so the ad's duration can be re-read once its media has loaded. The
  // quartile events carry no ad of their own.
  let currentAd: ShakaAd | undefined;

  function closeOpenBreak() {
    if (openBreakId === undefined) {
      return;
    }

    player.fp.dispatch("adbreakend", {
      view_ad_duration: openBreakDuration,
    });
    openBreakId = undefined;
    openBreakDuration = undefined;
    // The break is over, so nothing that renders afterwards is one of its ads.
    impressionPending = false;
    currentAd = undefined;
  }

  function openBreakFor(ad: ShakaAd, breakId: string, timeOffset?: number) {
    const sequenceLength = ad.getSequenceLength?.();
    const adDuration = ad.getDuration?.();

    // The break's length, not this ad's. Shaka declares neither, so a pod is
    // estimated from one ad times the pod size. Absent when either is unknown,
    // rather than reporting a single ad's length as the whole break.
    const breakDuration =
      typeof sequenceLength === "number" && sequenceLength > 0
        ? toMilliseconds(instance, (adDuration ?? 0) * sequenceLength)
        : toMilliseconds(instance, adDuration);

    openBreakId = breakId;
    openBreakDuration = breakDuration;

    player.fp.dispatch("adbreakstart", {
      view_ad_break_id: breakId,
      view_ad_break_position: describeBreakPosition(
        timeOffset,
        player.getMediaElement?.()?.duration,
      ),
      view_ad_duration: breakDuration,
      view_ad_time_offset: describeTimeOffset(instance, timeOffset),
      view_ad_asset_hostname: ad.getMediaUrl?.()
        ? instance.utilityMethods.fetchHost(ad.getMediaUrl() as string)
        : undefined,
    });
  }

  const handlers: Record<string, EventListener> = {
    // One break containing three advertisements raises this three times. The
    // break is opened on the first and left open for the rest, so the break
    // count follows pods rather than ads.
    [AD_EVENTS.started]: guard((event) => {
      const ad: ShakaAd | undefined = event?.ad;

      if (!ad) {
        return;
      }

      const podIndex = ad.getPodIndex?.();
      const timeOffset = ad.getTimeOffset?.();

      // A postroll's offset is -1, a sentinel rather than a position, and
      // interpolating it produced identifiers reading "at--1". Named instead,
      // so the identifier says where the break sat rather than restating a
      // value that means "not on the timeline".
      const breakId =
        timeOffset !== undefined && timeOffset < 0
          ? `pod-${podIndex ?? 0}-postroll`
          : `pod-${podIndex ?? 0}-at-${timeOffset ?? 0}`;

      if (breakId !== openBreakId) {
        closeOpenBreak();
        openBreakFor(ad, breakId, timeOffset);
      }

      const mediaUrl = ad.getMediaUrl?.();
      const adId = orAbsent(ad.getAdId?.());
      const creativeId = orAbsent(ad.getCreativeAdId?.());
      const advertiser = orAbsent(ad.getAdvertiserName?.());

      // getAdId means two different things and Shaka does not say which is in
      // hand. From a VAST response it is the industry Ad-ID - 6359933237 from
      // Google's sample tag. From a manifest declared break it is the
      // EXT-X-DATERANGE or Event id, "ad1", which names the break in that one
      // playlist and nothing beyond it.
      //
      // Gating on the creative or advertiser being present looked like the way
      // to tell them apart, but Shaka's VAST parser keeps only id, uri,
      // mimeType, isSkippable, skipOffset, clickThroughUrl and tracking - the
      // advertiser and creative are read and discarded - so that test can never
      // pass and the field was always empty, including when a real Ad-ID was
      // sitting right there.
      //
      // Reported unconditionally instead. A customer running an ad server is
      // the one who reads this field and they get the real value; a customer on
      // a plain manifest gets a stable identifier rather than an empty column.
      // view_ad_asset_id carries the same value either way, so nothing is lost
      // by the two agreeing.

      // adplay, not an impression. Shaka raises this when the ad is selected
      // and attached; nothing has rendered yet and an ad left paused on its
      // first frame reaches here identically. The impression is derived in the
      // core, from playback actually being reported.
      player.fp.dispatch("adplay", {
        view_ad_break_id: breakId,
        view_ad_asset_id: adId,
        // One-based within the pod, which is the order the ads were served in.
        view_ad_asset_index: ad.getPositionInSequence?.(),
        view_ad_asset_url: mediaUrl ?? undefined,
        view_ad_asset_duration: toMilliseconds(instance, ad.getDuration?.()),

        // Shaka parses the VAST response itself, so these arrive without the
        // integrator dispatching anything. The hls.js and dash.js paths cannot
        // populate them - a manifest carries no VAST.
        view_ad_id: adId,
        view_ad_creative_id: creativeId,
        view_ad_advertiser_name: advertiser,
        view_ad_skip_time_offset: ad.isSkippable?.()
          ? toMilliseconds(instance, ad.getTimeUntilSkippable?.())
          : undefined,
      });

      // Armed last, so an impression Shaka raised before this point - which is
      // every interstitial impression - has already been discarded.
      impressionPending = true;
      currentAd = ad;
    }),

    // Both durations are unknown when the ad starts: Shaka returns -1 until the
    // ad's media is ready, and it never sends ad-duration-changed on the
    // interstitial path, so there is nothing to wait for but playback progress.
    // A quarter of the way in the figure is settled.
    //
    // Sent under a name the core has no handler for. Every dispatched event has
    // its payload merged into the view data, so the durations land and ride out
    // on the next beacon without incrementing a count or opening anything.
    [AD_EVENTS.firstQuartile]: guard(() => {
      const assetDuration = toMilliseconds(
        instance,
        currentAd?.getDuration?.(),
      );

      if (assetDuration === undefined) {
        return;
      }

      const podSize = currentAd?.getSequenceLength?.();
      const breakDuration =
        typeof podSize === "number" && podSize > 0
          ? assetDuration * podSize
          : assetDuration;

      // Kept so the adbreakend that settles this break reports it too.
      openBreakDuration = breakDuration;

      player.fp.dispatch("adDurationResolved", {
        view_ad_asset_duration: assetDuration,
        view_ad_duration: breakDuration,
      });
    }),

    // An impression is a rendered frame, so it can only follow the ad starting.
    // Shaka's interstitial manager raises this one line *before* ad-started,
    // when the ad has been selected and nothing has loaded - an ad that then
    // fails to load raises it just the same.
    //
    // Forwarding that unconditionally does more than overcount: the core reads
    // an impression as proof the ad played and clears it from the failed set,
    // so a break whose ads all failed settles with no errors at all. Gating on
    // the ad having started is what keeps the ad error fields truthful, and it
    // holds for IMA too, whose impression genuinely follows the first frame.
    [AD_EVENTS.impression]: guard(() => {
      if (!impressionPending) {
        return;
      }

      impressionPending = false;
      player.fp.dispatch("adimpression", {});
    }),

    [AD_EVENTS.complete]: guard(() => {
      impressionPending = false;
      player.fp.dispatch("adended", { view_ad_break_id: openBreakId });
    }),

    // An ad the viewer skipped still ended, and still played whatever ran
    // before the skip. Counting it as completed would overstate completion, so
    // it closes the ad without being one.
    [AD_EVENTS.skipped]: guard(() => {
      impressionPending = false;
      player.fp.dispatch("adended", { view_ad_break_id: openBreakId });
    }),

    // Two different error shapes arrive here. Shaka's own interstitial manager
    // sets originalEvent to a shaka.util.Error, which carries code, category
    // and data. Google IMA sends an AdErrorEvent, whose detail is reached
    // through getError(). Neither exposes the other's properties, so both are
    // read rather than assuming the mechanism in use.
    [AD_EVENTS.error]: guard((event) => {
      const ad: ShakaAd | undefined = event?.ad;
      const detail = event?.originalEvent ?? event?.getError?.() ?? event;

      // This ad is over, so a later impression cannot belong to it.
      impressionPending = false;

      const code = detail?.code ?? detail?.getErrorCode?.();
      const message =
        detail?.message ||
        detail?.getMessage?.() ||
        // A compiled Shaka build strips the message, leaving the category and
        // the failing uri in data as the only description of what happened.
        (detail?.data ? String(detail.data) : undefined);

      player.fp.dispatch("aderror", {
        view_ad_break_id: openBreakId,
        view_ad_asset_id: orAbsent(ad?.getAdId?.()),
        view_ad_error_source: "shaka-ad-manager",
        view_ad_error_message: orAbsent(message),
        view_ad_error_code:
          code === undefined || code === null ? undefined : String(code),
      });
    }),

    // Closes the break. Each of these marks the whole pod being done, which is
    // the boundary the core needs - ad-stopped fires per ad and would close the
    // break on the first one of a pod.
    [AD_EVENTS.allCompleted]: guard(() => {
      closeOpenBreak();
    }),

    [AD_EVENTS.breakEnded]: guard(() => {
      closeOpenBreak();
    }),

    [AD_EVENTS.contentResume]: guard(() => {
      closeOpenBreak();
    }),

    [AD_EVENTS.loaded]: guard(() => {
      player.fp.dispatch("adrequest", {});
    }),

    // The schedule, known before playback reaches any of it. A preroll at
    // offset zero can therefore be reported as requested even if it never
    // fills, which is what makes view_preroll_played a fill rate.
    //
    // prerollRequested is sent alongside it rather than instead: scheduled is
    // the denominator, requested is what stamps the time the wait began, and
    // without the second view_preroll_load_time has nothing to measure from.
    [AD_EVENTS.cuepoints]: guard((event) => {
      const cuePoints: any[] = event?.cuepoints ?? [];

      if (cuePoints.some((point) => point?.start === 0)) {
        player.fp.dispatch("prerollScheduled", {});
        player.fp.dispatch("prerollRequested", {});
      }
    }),
  };

  Object.entries(handlers).forEach(([eventName, handler]) => {
    adManager.addEventListener(eventName, handler);
  });

  return () => {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      adManager.removeEventListener?.(eventName, handler);
    });
    // A view that ends mid-break would otherwise leave the core's ad flag set,
    // which suppresses content events until its watchdog fires.
    closeOpenBreak();
  };
}
