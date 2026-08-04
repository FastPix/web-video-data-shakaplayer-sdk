# Real-time analytics for Shaka Player

[![npm version](https://img.shields.io/npm/v/@fastpix/video-data-shakaplayer)](https://www.npmjs.com/package/@fastpix/video-data-shakaplayer)
[![npm downloads](https://img.shields.io/npm/dm/@fastpix/video-data-shakaplayer)](https://www.npmjs.com/package/@fastpix/video-data-shakaplayer)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@fastpix/video-data-shakaplayer)](https://bundlephobia.com/package/@fastpix/video-data-shakaplayer)
[![License](https://img.shields.io/github/license/FastPix/shaka-player-analytics)](./LICENSE)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
<!-- [![CI](https://img.shields.io/github/actions/workflow/status/FastPix/shaka-player-analytics/ci.yml)](https://github.com/FastPix/shaka-player-analytics/actions) -->

Monitor **Shaka Player** with real-time playback analytics. Track rebuffering, startup time, bitrate changes, playback errors, QoE metrics and viewer engagement for HLS and DASH streams, in a few lines of code, straight to the FastPix dashboard.

**Works with:** Shaka Player · HLS · DASH · JavaScript · TypeScript · React · Next.js · Vite

📖 **Docs:** https://fastpix.com/docs/video-data/monitors/the-shaka-player &nbsp;·&nbsp; 🚀 **Free account:** https://dashboard.fastpix.com/signup
<!-- TODO: add a live demo URL here, or remove this line before publishing -->

![FastPix real-time Shaka Player analytics dashboard](docs/images/dashboard.png)
*Real-time playback analytics on the FastPix dashboard.*

---

## Why FastPix?

- **Automatic instrumentation** - one integration call, no manual event wiring.
- **Real-time QoE analytics** - rebuffering, startup time, bitrate, errors and watch time as playback happens.
- **Playback diagnostics** - detailed error codes and context to resolve failures fast.
- **Viewer engagement** - understand how people actually watch.
- **One dashboard** - compare metrics across every player and platform in a single place.

## What You Can Track with Shaka Player Analytics

- Video startup / player-load latency
- Rebuffering events and rebuffer ratio
- Bitrate switches and adaptive-bitrate behavior
- Playback failures with error codes
- Viewer engagement and watch time
- HLS playback analytics
- DASH playback analytics
- Custom metadata (`custom_1` to `custom_10`)
- Privacy controls: cookie-free tracking and Do Not Track

## Before you start

You'll need:

- A free FastPix account - [sign up](https://dashboard.fastpix.com/signup).
- Your **Workspace key** from the dashboard (see [Workspaces](https://fastpix.com/docs/getting-started/set-up-a-workspace)). It identifies your workspace and is required.
- Node.js and npm installed.
- A working Shaka Player setup with an HTML5 `<video>` element. New to Shaka Player? See the [Shaka Player docs](https://github.com/shaka-project/shaka-player).

If you have those, the Quickstart below is copy-paste ready.

## Install the Shaka Player Analytics SDK

```bash
npm i @fastpix/video-data-shakaplayer
```

## How to Monitor Shaka Player Playback

Grab your Workspace key from the [FastPix dashboard](https://dashboard.fastpix.com) (see [Workspaces](https://fastpix.com/docs/getting-started/set-up-a-workspace)), then bind the SDK to your Shaka Player instance:

```javascript
import loadShakaPlayer from "@fastpix/video-data-shakaplayer";
import shaka from "shaka-player";

// Capture the init timestamp for accurate startup metrics
const initTime = loadShakaPlayer.utilityMethods.now();

const videoElement = document.getElementById("video-player");
const player = new shaka.Player(videoElement);

const playerMetadata = {
  workspace_id: "WORKSPACE_KEY", // required - from your FastPix dashboard
  player_name: "Main Player",
  player_init_time: initTime,
  video_title: "My Video",
  video_id: "video-id",
  viewer_id: "viewer-id",
};

const fastPixShaka = loadShakaPlayer(
  player,
  { debug: false, data: playerMetadata },
  shaka
);

player
  .load("https://stream.fastpix.com/<your-stream>.m3u8")
  .then(() => console.log("Manifest loaded - FastPix is now tracking playback."))
  .catch((error) => fastPixShaka.handleLoadError(error));
```

That's it. Once playback starts, metrics appear on the [FastPix dashboard](https://dashboard.fastpix.com).

**Cleanup:** call `player.fp.destroy()` **before** `player.destroy()` so FastPix tracking is torn down first:

```javascript
player.fp.destroy(); // ends FastPix tracking
player.destroy();    // destroys the Shaka Player
```

## Track Custom Metadata and Video Metrics

Pass named fields (`video_title`, `video_id`, `video_content_type`, `video_stream_type`) directly, and use `custom_1` to `custom_10` for your own business logic. See the [user-passable metadata](https://fastpix.com/docs/video-data/pass-custom-metadata-to-metrics) reference.

```javascript
const playerMetadata = {
  workspace_id: "WORKSPACE_KEY",
  video_title: "Test Content",
  video_id: "f01a98s76t90p88i67x",
  viewer_id: "user12345",
  video_content_type: "series",
  video_stream_type: "on-demand",
  custom_1: "campaign-42",
  custom_2: "team-sports",
};
```

Keep metadata consistent across video loads so comparisons in the dashboard stay clean.

## Configure Privacy, Cookies and Error Tracking

| Option | What it does | Type | Example |
|---|---|---|---|
| `disableCookies` | Track without setting cookies for sessions / unique viewers | Boolean | `disableCookies: true` |
| `respectDoNotTrack` | Honor the browser "Do Not Track" setting | Boolean | `respectDoNotTrack: true` |
| `automaticErrorTracking` | Auto-track playback failures (disable for manual control) | Boolean | `automaticErrorTracking: false` |
| `debug` | Print debug logs to the console | Boolean | `debug: true` |

```javascript
const fastPixShaka = loadShakaPlayer(
  player,
  {
    debug: false,
    disableCookies: true,
    respectDoNotTrack: true,
    automaticErrorTracking: false,
    data: { workspace_id: "WORKSPACE_KEY" },
  },
  shaka
);
```

## Track Buffering, Errors and Stream Changes

Emit a custom error for non-fatal issues:

```javascript
player.fp.dispatch("error", {
  player_error_code: 1008,
  player_error_message: "Description of error",
  player_error_context: "Additional context",
});
```

When the same player plays a new video (playlists, series), tell the SDK so metrics don't merge:

```javascript
player.fp.dispatch("videoChange", {
  video_id: "abc345",
  video_title: "My Other Great Video",
  video_series: "Weekly Great Videos",
});
```

## Monitor HLS and DASH Playback Analytics

Shaka Player plays both HLS (`.m3u8`) and DASH (`.mpd`) natively. The SDK tracks either one automatically - just load the manifest as usual; no extra configuration is needed. Rebuffering, bitrate and startup metrics are collected the same way for both formats.

## Framework Examples (JavaScript, TypeScript, React, Next.js, Vite)

Runnable integrations live in [`examples/`](./examples):

- [JavaScript](./examples/javascript)
- [TypeScript](./examples/typescript)
- [React](./examples/react)
- [Next.js](./examples/nextjs)
- [Vite](./examples/vite)

## Which FastPix Analytics SDK for Which Player

Using a different player? FastPix has an analytics SDK for each. (HLS.js and Dash.js are covered by the HTML5 core SDK - there is no separate repo for them.)

| Player / framework | FastPix analytics SDK |
|---|---|
| Shaka Player | **This repo** |
| Video.js | [web-videojs-data-monitoring](https://github.com/FastPix/web-videojs-data-monitoring) |
| HTML5 `<video>` / HLS.js / Dash.js | [web-video-data-core-sdk](https://github.com/FastPix/web-video-data-core-sdk) |
| Android (ExoPlayer) | [android-data-exoplayer-sdk](https://github.com/FastPix/android-data-exoplayer-sdk) |
| Android (Media3) | [android-data-androidXmedia3](https://github.com/FastPix/android-data-androidXmedia3) |
| iOS (AVPlayer) | [iOS-data-avplayer-sdk](https://github.com/FastPix/iOS-data-avplayer-sdk) |
| Flutter | [flutter-core-data-sdk](https://github.com/FastPix/flutter-core-data-sdk) |
| React Native | [react-native-video-data](https://github.com/FastPix/react-native-video-data) |
| Roku | [Roku-data-core-SDK](https://github.com/FastPix/Roku-data-core-SDK) |

## FAQ

**How do I track rebuffering and QoE in Shaka Player?**
Install `@fastpix/video-data-shakaplayer`, then pass your Shaka Player instance to `loadShakaPlayer(player, { data: { workspace_id } }, shaka)`. Rebuffering, startup time, bitrate and other QoE metrics are collected automatically and shown on the FastPix dashboard.

**How do I collect playback analytics from Shaka Player?**
The SDK instruments the player for you. After the integration call and `player.load(...)`, metrics start flowing once playback begins.

**How do I measure buffering and startup time?**
Both are tracked automatically. Startup time is most accurate when you set `player_init_time` using `loadShakaPlayer.utilityMethods.now()` at init, as shown in the quickstart.

**Does it support HLS and DASH?**
Yes. Shaka Player handles both, and the SDK tracks either format with no extra setup.

**Does it work with React, Next.js or Vite?**
Yes - see the [examples](./examples) folder for each.

**Does it support TypeScript?**
The SDK is written in TypeScript. The published package currently ships JavaScript output; type definitions are planned for a future release.

**Can I send custom metadata?**
Yes - use `custom_1` to `custom_10` plus the named fields. See [user-passable metadata](https://fastpix.com/docs/video-data/pass-custom-metadata-to-metrics).

**How do I stop tracking / clean up?**
Call `player.fp.destroy()` before `player.destroy()`.

## Troubleshooting Shaka Player Analytics

- **No data on the dashboard?** Confirm `workspace_id` is set and correct, and that playback actually started (`player.load(...)` resolved).
- **Errors on load?** Route them through `fastPixShaka.handleLoadError(error)` in your `.catch` so failures are reported.
- **Metrics look merged across videos?** Emit `player.fp.dispatch("videoChange", { ... })` when a new video starts in the same player.
- **Need more detail?** Set `debug: true` to see SDK logs in the console.

## Documentation

Full guide: https://fastpix.com/docs/video-data/monitors/the-shaka-player

## Contributing

Contributions are welcome - see [CONTRIBUTING.md](./CONTRIBUTING.md). If this SDK helps you, a ⭐ on the repo helps others find it.

## License

MIT - see [LICENSE](./LICENSE).
