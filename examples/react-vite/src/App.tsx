import { useRef, useState } from "react";
import { useShakaTracker } from "./useShakaTracker";

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

export default function App() {
  const [kind, setKind] = useState<keyof typeof STREAMS>("hls");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stream = STREAMS[kind];

  useShakaTracker(videoRef, {
    src: stream.src,
    metadata: {
      workspace_id: WORKSPACE_KEY,
      player_name: "react-vite-shaka",
      video_title: stream.title,
      video_id: stream.video_id,
    },
  });

  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Shaka Player + FastPix (React + Vite)</h1>
      <p>
        <button onClick={() => setKind("hls")} disabled={kind === "hls"}>HLS</button>{" "}
        <button onClick={() => setKind("dash")} disabled={kind === "dash"}>DASH</button>
      </p>
      {/* key={kind} forces a full remount on switch, exercising the destroy/re-attach path. */}
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
