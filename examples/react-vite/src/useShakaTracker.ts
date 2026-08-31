import { useEffect } from "react";
import type { RefObject } from "react";
import shaka from "shaka-player";
import loadShakaPlayer from "@fastpix/video-data-shakaplayer";

type Options = {
  src: string;
  metadata: Record<string, unknown>;
};

// Attaches Shaka Player + FastPix tracking to a <video> ref, and tears both
// down on cleanup. Encapsulates the correct order: fp.destroy() before
// player.destroy(). Remount it (via a `key` on the <video>) to switch streams.
export function useShakaTracker(
  videoRef: RefObject<HTMLVideoElement | null>,
  { src, metadata }: Options,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      console.error("Shaka Player is not supported in this browser.");
      return;
    }

    const initTime = loadShakaPlayer.utilityMethods.now();
    const player = new shaka.Player(video);

    // Pass the imported `shaka` namespace explicitly: in a bundled app there is
    // no window.shaka global, so the SDK can't auto-detect it for error naming.
    const integration = loadShakaPlayer(
      player,
      { debug: false, data: { ...metadata, player_init_time: initTime } },
      shaka,
    );

    player.load(src).catch((err) => {
      integration.handleLoadError(err);
      console.error("Error loading manifest:", err);
    });

    return () => {
      // FastPix attaches its handle to the PLAYER instance (player.fp), not the
      // <video> element. End tracking first, then dispose the player.
      (player as unknown as { fp?: { destroy: () => void } }).fp?.destroy();
      player.destroy();
    };
  }, [videoRef, src, metadata]);
}
