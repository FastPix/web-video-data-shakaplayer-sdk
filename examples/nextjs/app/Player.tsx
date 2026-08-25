"use client";

import { useEffect, useRef, useState } from "react";
import loadShakaPlayer from "@fastpix/video-data-shakaplayer";

const STREAMS = {
  hls: {
    src: "https://stream.fastpix.com/7c8d5087-edf7-462f-a1b3-e2fbd30747fa.m3u8",
    title: "FastPix sample (HLS)",
    video_id: "sample-hls-001",
  },
  // FastPix sample asset is HLS-only; public DASH test stream stands in.
  dash: {
    src: "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
    title: "Big Buck Bunny (DASH)",
    video_id: "sample-dash-001",
  },
};

// Get your Workspace Key from https://dashboard.fastpix.com
const WORKSPACE_KEY = "WORKSPACE_KEY";

export default function Player() {
  const [kind, setKind] = useState<keyof typeof STREAMS>("hls");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let player: { destroy: () => void; fp?: { destroy: () => void } } | null = null;
    let cancelled = false;

    // shaka-player touches `window`/`document` at import time, so it is
    // browser-only. Import it lazily here (never on the server) instead of a
    // top-level import. The FastPix SDK import above is SSR-safe on its own.
    import("shaka-player").then(({ default: shaka }) => {
      if (cancelled || !videoRef.current) return;

      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        console.error("Shaka Player is not supported in this browser.");
        return;
      }

      const stream = STREAMS[kind];
      const initTime = loadShakaPlayer.utilityMethods.now();
      const p = new shaka.Player(videoRef.current);
      player = p as unknown as typeof player;

      const integration = loadShakaPlayer(
        p,
        {
          debug: false,
          data: {
            workspace_id: WORKSPACE_KEY,
            player_name: "nextjs-shaka",
            player_init_time: initTime,
            video_title: stream.title,
            video_id: stream.video_id,
          },
        },
        shaka, // pass the namespace explicitly (no window.shaka in a bundled app)
      );

      p.load(stream.src).catch((err: unknown) => {
        integration.handleLoadError(err);
        console.error("Error loading manifest:", err);
      });
    });

    return () => {
      cancelled = true;
      // fp.destroy() before player.destroy().
      player?.fp?.destroy();
      player?.destroy();
    };
  }, [kind]);

  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Shaka Player + FastPix (Next.js App Router)</h1>
      <p>
        <button onClick={() => setKind("hls")} disabled={kind === "hls"}>HLS</button>{" "}
        <button onClick={() => setKind("dash")} disabled={kind === "dash"}>DASH</button>
      </p>
      {/* key={kind} remounts the element on switch, exercising destroy/re-attach. */}
      <video
        key={kind}
        ref={videoRef}
        controls
        playsInline
        crossOrigin="anonymous"
        style={{ width: "100%", maxHeight: "70vh", background: "#111" }}
      />
    </main>
  );
}
