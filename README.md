# Real-time analytics for Shaka Player

[![npm version](https://img.shields.io/npm/v/@fastpix/video-data-shakaplayer)](https://www.npmjs.com/package/@fastpix/video-data-shakaplayer)
[![npm downloads](https://img.shields.io/npm/dm/@fastpix/video-data-shakaplayer)](https://www.npmjs.com/package/@fastpix/video-data-shakaplayer)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@fastpix/video-data-shakaplayer)](https://bundlephobia.com/package/@fastpix/video-data-shakaplayer)
[![License](https://img.shields.io/github/license/FastPix/web-video-data-shakaplayer-sdk)](./LICENSE)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)

Add real-time playback analytics to **Shaka Player**. This SDK plugs FastPix into your Shaka Player setup and automatically tracks video performance - startup time, rebuffering, bitrate changes, playback errors and viewer engagement - and streams the data to the [FastPix dashboard](https://dashboard.fastpix.com) for monitoring and analysis.

The SDK is written in TypeScript; the published npm package currently ships JavaScript output, and type definitions are planned for a future release.

**Works with:** Shaka Player · HLS · DASH · JavaScript (any framework)

📖 **Docs:** https://fastpix.com/docs/video-data/monitors/the-shaka-player &nbsp;·&nbsp; 🚀 **Free account:** https://dashboard.fastpix.com

## Why FastPix?

- **Automatic instrumentation** - one integration call, no manual event wiring.
- **Playback quality monitoring** - real-time bitrate, buffering, startup performance, render quality and playback failures.
- **Error management** - detailed error reports to find and fix playback failures quickly.
- **Customizable tracking** - flexible configuration to match your monitoring needs.
- **Centralized dashboard** - visualize and compare metrics on the FastPix dashboard to make data-driven decisions.

<br />

## What you can track with Shaka Player analytics

- Viewer engagement and watch behavior
- Startup performance and video-start time
- Rebuffering and buffering events
- Bitrate and adaptive-bitrate changes
- Render quality
- Playback failures and error codes
- HLS playback analytics
- DASH playback analytics
- Custom metadata (`custom_1` to `custom_10`)
- Privacy controls: cookie-free tracking and Do Not Track

<br />

## Before you begin

You'll need:

- A free FastPix account - [sign up](https://dashboard.fastpix.com).
- Your **Workspace key** from the dashboard (learn more about [Workspaces](https://fastpix.com/docs/getting-started/set-up-a-workspace)). It uniquely identifies your workspace and is required.
- Node.js and npm.
- A working Shaka Player setup with an HTML5 `<video>` element. New to Shaka Player? See the [Shaka Player project](https://github.com/shaka-project/shaka-player).

<br />

## Install the Shaka Player analytics SDK

To get started with the SDK, install it using npm or your favourite Node package manager:

```bash
npm i @fastpix/video-data-shakaplayer
```

<br />

## How to monitor Shaka Player playback

Import the SDK:

```javascript
import loadShakaPlayer from "@fastpix/video-data-shakaplayer";
```

Provide the `workspace_id` (a mandatory field that identifies your workspace). Initialize the Shaka Player instance, bind it to an HTML5 `<video>` element, then use `loadShakaPlayer` to pass the player, the player metadata and the `shaka` instance so FastPix can track playback. Once the video URL loads and playback starts, the SDK begins tracking analytics.

```javascript
import loadShakaPlayer from "@fastpix/video-data-shakaplayer";
import shaka from "shaka-player"; // Import Shaka Player

// Initialize player setup
const initTime = loadShakaPlayer.utilityMethods.now(); // Captures the exact timestamp of player initialization
const videoElement = document.getElementById("video-player"); // Select the HTML5 video element for Shaka Player
const player = new shaka.Player(videoElement); // Create a Shaka Player instance bound to the video element

// Define player metadata
const playerMetadata = {
  workspace_id: "WORKSPACE_KEY", // Mandatory field for FastPix integration, replace with your actual workspace key
  player_name: "PLAYER_NAME", // A unique identifier for this player instance (e.g., "MyVideoPlayer1")
  player_init_time: initTime, // The timestamp when the player was initialized, useful for analytics
  video_title: "VIDEO_TITLE", // The title of the video being played (e.g., "My Amazing Video")
  video_id: "VIDEO_ID", // Unique identifier for the video (e.g., from your CMS or database)
  viewer_id: "VIEWER_ID", // Unique identifier for the viewer

  // Additional metadata
};

// Configure FastPix data integration
const fastPixShakaIntegration = loadShakaPlayer(
  player, // The Shaka Player instance managing playback
  {
    debug: false, // Optional flag; set to true to enable debug logs for troubleshooting
    data: playerMetadata,
  },
  shaka, // Pass the imported Shaka Player instance for proper integration
);

// Load the video content
const videoUrl =
  "https://stream.fastpix.io/027a90e4-f5e2-433d-81e5-b99ee864c3f6.m3u8"; // Replace with your video manifest URL

player
  .load(videoUrl) // Load the video manifest URL into the Shaka Player
  .then(() => {
    // Successfully loaded the manifest; FastPix will now begin tracking playback data
    console.log("Video manifest loaded successfully.");
  })
  .catch((error) => {
    // Handle errors that occur while loading the video manifest
    fastPixShakaIntegration.handleLoadError(error); // Notify FastPix of the error
    console.error("Error loading video manifest:", error); // Log the error for debugging
  });

// Use these methods to destroy fastpix data sdk and shakaplayer:

// player.destroy() - Destroys the Shaka Player
// player.fp.destroy() - Ends FastPix tracking
```

<br />

### Cleanup

To ensure proper cleanup of both Shaka Player and FastPix data tracking, you must call player.fp.destroy() before player.destroy() when destroying the Shaka Player instance.

```javascript
player.destroy(); //Destroys the Shaka Player
player.fp.destroy(); //Ends FastPix tracking
```

After completing the steps above, you can track viewer metrics in the [FastPix dashboard](https://dashboard.fastpix.com) once playback ends. The sections below are optional and can be used as needed to enhance your integration.

<br />

## Track custom metadata and video metrics

Check out the [user-passable metadata](https://fastpix.com/docs/working-with-video-data/pass-custom-metadata-to-metrics) documentation to see the metadata supported by FastPix. You can use custom metadata fields like `custom_1` to `custom_10` for your business logic, giving you the flexibility to pass any required values. Named attributes, such as `video_title` and `video_id`, can be passed directly as they are.

```javascript
import loadShakaPlayer from "@fastpix/video-data-shakaplayer";
import shaka from "shaka-player"; // Import Shaka Player

// Initialize player setup
const initTime = loadShakaPlayer.utilityMethods.now(); // Captures the exact timestamp of player initialization
const videoElement = document.getElementById("video-player"); // Select the HTML5 video element for Shaka Player
const player = new shaka.Player(videoElement); // Create a Shaka Player instance bound to the video element

// Define player metadata
const playerMetadata = {
  workspace_id: "WORKSPACE_KEY", // Unique key to identify your workspace (replace with your actual workspace key)
  player_name: "Main Video Player", // A custom name or identifier for this video player instance
  player_init_time: initializationTime, // Timestamp of when the player was initialized (useful for tracking performance metrics)
  video_title: "Test Content", // Title of the video being played (replace with the actual title of your video)
  video_id: "f01a98s76t90p88i67x", // A unique identifier for the video (replace with your actual video ID for tracking purposes)
  viewer_id: "user12345", // A unique identifier for the viewer (e.g., user ID, session ID, or any other unique value)
  video_content_type: "series", // Type of content being played (e.g., series, movie, etc.)
  video_stream_type: "on-demand", // Type of streaming (e.g., live, on-demand)

  // Custom fields for additional business logic
  custom_1: "", // Use this field to pass any additional data needed for your specific business logic
  custom_2: "", // Use this field to pass any additional data needed for your specific business logic

  // Add any additional metadata
};

// Configure FastPix data integration
const fastPixShakaIntegration = loadShakaPlayer(
  player, // The Shaka Player instance managing playback
  {
    debug: false, // Optional flag; set to true to enable debug logs for troubleshooting
    data: playerMetadata,
  },
  shaka, // Pass the imported Shaka Player instance for proper integration
);

// Load the video content
const videoUrl =
  "https://stream.fastpix.io/027a90e4-f5e2-433d-81e5-b99ee864c3f6.m3u8"; // Replace with your video manifest URL

player
  .load(videoUrl) // Load the video manifest URL into the Shaka Player
  .then(() => {
    // Successfully loaded the manifest; FastPix will now begin tracking playback data
    console.log("Video manifest loaded successfully.");
  })
  .catch((error) => {
    // Handle errors that occur while loading the video manifest
    fastPixShakaIntegration.handleLoadError(error); // Notify FastPix of the error
    console.error("Error loading video manifest:", error); // Log the error for debugging
  });
```

Keep metadata consistent across different video loads to make comparison easier in your analytics dashboard.

<br />

## Configure privacy, cookies and error tracking

| Attribute                | Description                                                                                                                                                                                                                                                                                                                                                  | Type    | Example Usage                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------- |
| `disableCookies`         | FastPix Data SDK uses cookies by default to track playback across page views and to identify unique viewers. If your application is not intended to collect cookies, you can disable this feature by setting `disableCookies: true`. This ensures that no cookies are set during the user's session, enhancing privacy and compliance with user preferences. | Boolean | `disableCookies: true`          |
| `respectDoNotTrack`      | Set to true to honor users' privacy preferences regarding the 'Do Not Track' setting.                                                                                                                                                                                                                                                                        | Boolean | `respectDoNotTrack: true`       |
| `automaticErrorTracking` | FastPix automatically tracks errors that occur during playback failures. To disable this feature, set `automaticErrorTracking` to false. This allows you to have more control over errors which are considered fatal and helps you manage error reporting according to your application's needs.                                                             | Boolean | `automaticErrorTracking: false` |
| `debug`                  | Set to true to enable debug logs in the console for troubleshooting purposes.                                                                                                                                                                                                                                                                                | Boolean | `debug: true`                   |

```javascript
// player is the instance returned by `new shaka.Player`
const fastPixShakaIntegration = loadShakaPlayer(
  player, // The Shaka Player instance managing playback
  {
    debug: false, // Optional flag; set to true to enable debug logs for troubleshooting
    disableCookies: true, // Set to true to disable cookies for tracking sessions and unique viewers
    respectDoNotTrack: true, // Set to true to honor users' 'Do Not Track' preferences
    automaticErrorTracking: false, // Set to false to disable automatic tracking of fatal errors
    data: {
      workspace_id: "WORKSPACE_KEY", // Mandatory field for FastPix integration, replace with your actual workspace key

      // Additional metadata
    },
  },
  shaka, // Pass the imported Shaka Player instance
);
```

<br />

## Track buffering, errors and stream changes

By default, FastPix tracks errors that occur during playback failures. You can also emit a custom error event for non-severe issues that arise outside of these failures, to provide additional context for tracking purposes.

```javascript
// player is the instance returned by `new shaka.Player`
player.fp.dispatch("error", {
  player_error_code: 1008, // Custom error code
  player_error_message: "Description of error", // Generalized error message
  player_error_context: "Additional context for the error", // Instance-specific information
});
```

When your application plays multiple videos back-to-back in the same player, notify the FastPix SDK whenever a new video starts - for example with playlist content, a video series, or any other video the user plays next.

```javascript
// player is the instance returned by `new shaka.Player`
player.fp.dispatch("videoChange", {
  video_id: "abc345", // Unique identifier for the new video
  video_title: "My Other Great Video", // Title of the new video
  video_series: "Weekly Great Videos", // Series name if applicable

  // ... and other metadata
});
```

<br />

## Monitor HLS and DASH playback analytics

Shaka Player plays both HLS (`.m3u8`) and DASH (`.mpd`) natively, and the SDK tracks either format automatically. Load the manifest as usual - no extra configuration is needed - and rebuffering, bitrate and startup metrics are collected the same way for both.

## Which FastPix analytics SDK for which player

Using a different player? FastPix has an analytics SDK for each. (Only repositories confirmed to exist are linked here.)

| Player / framework | FastPix analytics SDK |
|---|---|
| Shaka Player | **This repo** |
| Video.js | [web-videojs-data-monitoring](https://github.com/FastPix/web-videojs-data-monitoring) |
| HTML5 `<video>` (core web) | [web-video-data-core-sdk](https://github.com/FastPix/web-video-data-core-sdk) |
| Android (ExoPlayer) | [android-data-exoplayer-sdk](https://github.com/FastPix/android-data-exoplayer-sdk) |
| Android (Media3) | [android-data-androidXmedia3](https://github.com/FastPix/android-data-androidXmedia3) |
| Android (core) | [android-core-data-sdk](https://github.com/FastPix/android-core-data-sdk) |
| iOS (AVPlayer) | [iOS-data-avplayer-sdk](https://github.com/FastPix/iOS-data-avplayer-sdk) |
| iOS (core) | [iOS-core-data-sdk](https://github.com/FastPix/iOS-core-data-sdk) |

More SDKs are available in the [FastPix organization](https://github.com/orgs/FastPix/repositories).

<br />

## FAQ

**How do I track rebuffering and QoE in Shaka Player?**

Install `@fastpix/video-data-shakaplayer` and pass your Shaka Player instance to `loadShakaPlayer` with your `workspace_id`, as shown in "How to monitor Shaka Player playback." Rebuffering, startup time, bitrate and other quality metrics are then collected automatically and shown on the FastPix dashboard.

**How do I collect playback analytics from Shaka Player?**

The SDK instruments the player for you. After the integration call and `player.load(...)`, metrics start flowing once playback begins.

**Does it support HLS and DASH?**

Yes. Shaka Player handles both, and the SDK tracks either format with no extra setup.

**Does it work with React, Next.js or other frameworks?**

Yes. It is a JavaScript SDK, so it works in any framework - initialize it where you create your Shaka Player instance.

**Does it support TypeScript?**

The SDK is written in TypeScript. The published package currently ships JavaScript output; type definitions are planned for a future release.

**Can I send custom metadata?**

Yes - use the named fields plus `custom_1` to `custom_10`. See "Track custom metadata and video metrics."

**How do I stop tracking and clean up?**

Call `player.fp.destroy()` before `player.destroy()`, as described in "Cleanup."

<br />

## Troubleshooting Shaka Player analytics

- **No data on the dashboard?**

  Confirm your `workspace_id` is set and correct, and that playback actually started (`player.load(...)` resolved).

- **Errors on load?**

  Route them through `fastPixShakaIntegration.handleLoadError(error)` in your `.catch` so failures are reported.

- **Metrics look merged across videos?**

  Emit a `videoChange` event when a new video starts in the same player, as shown above.

- **Need more detail?**

  Set `debug: true` to see SDK logs in the console.

<br />

## Documentation

For more detailed steps and advanced usage, see the official [FastPix documentation](https://fastpix.com/docs/web-players/monitor-the-shaka-player).

## Support

Questions or issues? Open a [GitHub issue](https://github.com/FastPix/web-video-data-shakaplayer-sdk/issues) or check the [documentation](https://fastpix.com/docs/video-data/monitors/the-shaka-player).

## License

[MIT](https://github.com/FastPix/web-video-data-shakaplayer-sdk/blob/698b724b07a3fff766514aafe23f9568bf7fdded/LICENSE)
