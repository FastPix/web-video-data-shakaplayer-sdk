# Introduction

This SDK simplifies integration steps with [Shaka Player](https://github.com/shaka-project/shaka-player), enabling the collection of player analytics. It enables automatic tracking of video performance metrics, making the data readily available on the [FastPix dashboard](https://dashboard.fastpix.io) for monitoring and analysis. While the SDK is developed in TypeScript, the published npm package currently includes only the JavaScript output. TypeScript support, including type definitions, will be released in a future version.

# Key Features:

- **Track Viewer Engagement:** Gain insights into how users interact with your videos.
- **Monitor Playback Quality:** Ensure video streaming by monitoring real-time metrics, including bitrate, buffering, startup performance, render quality, and playback failure errors.
- **Error Management:** Identify and resolve playback failures quickly with detailed error reports.
- **Customizable Tracking:** Flexible configuration to match your specific monitoring needs.
- **Centralized Dashboard:** Visualize and compare metrics on the [FastPix dashboard](https://dashboard.fastpix.io) to make data-driven decisions.

# Prerequisites:

## Getting started with FastPix:

To track and analyze video performance, initialize the FastPix Data SDK with your Workspace key (learn more about [Workspaces here](https://docs.fastpix.io/docs/workspaces)):

1. **[Access the FastPix Dashboard](https://dashboard.fastpix.io)**: Log in and navigate to the Workspaces section.
2. **Locate Your Workspace Key**: Copy the Workspace Key for client-side monitoring. Include this key in your JavaScript code on every page where you want to track video performance.

# Step 1: Installation and setup:

To get started with the SDK, install using npm or your favourite node package manager 😉:

```bash
npm i @fastpix/video-data-shakaplayer
```

# Step 2: Import

```javascript
import loadShakaPlayer from "@fastpix/video-data-shakaplayer";
```

# Step 3: Basic Integration

Ensure that the `workspace_id` is provided, as it is a mandatory field for FastPix integration, uniquely identifying your workspace. Install and import Shaka Player into your project, and create an HTML5 `<video>` element to bind it to.

Once the video element is set up, initialize the Shaka Player instance and associate it with the video element. Use the `loadShakaPlayer` function to pass the Shaka Player instance, player metadata, and the `shaka` instance, enabling FastPix to track playback data.

Once the video URL is loaded and playback has started, the SDK will begin tracking the analytics.

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

### Note:

To ensure proper cleanup of both Shaka Player and FastPix data tracking, you must call player.fp.destroy() before player.destroy() when destroying the Shaka Player instance.

```javascript
player.destroy(); //Destroys the Shaka Player
player.fp.destroy(); //Ends FastPix tracking
```

After successfully completing Step 3, you can track viewer metrics in the [FastPix dashboard](https://dashboard.fastpix.io) once playback ends. Steps 4, 5, and 6 are optional and can be utilized as needed to enhance your integration.

# Step 4: Enhance Tracking with User Passable Metadata

Check out the [user-passable metadata](https://docs.fastpix.io/docs/user-passable-metadata) documentation to see the metadata supported by FastPix. You can use custom metadata fields like `custom_1` to `custom_10` for your business logic, giving you the flexibility to pass any required values. Named attributes, such as `video_title` and `video_id`, can be passed directly as they are.

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

### Note:

Keep metadata consistent across different video loads to make comparison easier in your analytics dashboard.

# Step 5: Advanced Customization with FastPix Data SDK

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

# Step 6: Emit Custom Events

### Advanced Error Reporting and Contextual Tracking

By default, FastPix tracks errors that occur during playback failures. However, you can also emit a custom error event for non-severe issues that arise outside of these failures, allowing you to provide additional context for tracking purposes.

```javascript
// player is the instance returned by `new shaka.Player`
player.fp.dispatch("error", {
  player_error_code: 1008, // Custom error code
  player_error_message: "Description of error", // Generalized error message
  player_error_context: "Additional context for the error", // Instance-specific information
});
```

### Changing video streams in player

When your application plays multiple videos back-to-back in the same player, it’s essential to notify the FastPix SDK whenever a new video starts; possibly in scenarios like playlist content/ video series or any other video that user wants to play.

```javascript
// player is the instance returned by `new shaka.Player`
player.fp.dispatch("videoChange", {
  video_id: "abc345", // Unique identifier for the new video
  video_title: "My Other Great Video", // Title of the new video
  video_series: "Weekly Great Videos", // Series name if applicable

  // ... and other metadata
});
```

# Detailed Usage:

For more detailed steps and advanced usage, please refer to the official [FastPix Documentation](https://docs.fastpix.io/docs/monitor-shaka-player).
