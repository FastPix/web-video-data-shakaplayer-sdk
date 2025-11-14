---
name: Bug Report
about: Report a bug or unexpected behavior in the FastPix Video Data SDK for Shaka Player
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

# Bug Report

Thank you for taking the time to report a bug with the FastPix Video Data SDK for Shaka Player. To help us resolve your issue quickly and efficiently, please provide the following information:

## Description
**Clear and concise description of the bug:**

<!-- Please provide a detailed description of what you're experiencing -->

## Environment Information

### System Details
- **Operating System:** [e.g., Windows 10, macOS 14.0, Ubuntu 22.04, iOS 17, Android 13, etc.]
- **Browser:** [e.g., Chrome 120, Firefox 121, Safari 17, Edge 120, etc.]
- **Browser Version:** [e.g., 120.0.6099.109, etc.]
- **Device Type:** [e.g., Desktop, Mobile, Tablet, Smart TV, etc.] (if applicable)

### SDK Information
- **FastPix Video Data SDK Version:** [e.g., 1.0.4, 1.0.3, etc.]
- **Shaka Player Version:** [e.g., 4.7.11, 4.6.1, etc.]
- **Package Manager:** [e.g., npm, yarn, pnpm, bun]
- **TypeScript Version:** [e.g., 5.5.3, 5.1.6, etc.] (if applicable)
- **Framework/Library:** [e.g., React, Vue, Angular, Vanilla JS, Next.js, etc.] (if applicable)

## Reproduction Steps

1. **Setup Environment:**
   ```bash
   npm install @fastpix/video-data-shakaplayer@latest
   npm install shaka-player
   ```

2. **Code to Reproduce:**
   ```javascript
   // Please provide a minimal, reproducible example
   import loadShakaPlayer from "@fastpix/video-data-shakaplayer";
   import shaka from "shaka-player";
   
   // Initialize player setup
   const initTime = loadShakaPlayer.utilityMethods.now();
   const videoElement = document.getElementById("video-player");
   const player = new shaka.Player(videoElement);
   
   // Define player metadata
   const playerMetadata = {
     workspace_id: "YOUR_WORKSPACE_KEY", // Mandatory field
     player_name: "MyVideoPlayer",
     player_init_time: initTime,
     video_title: "Test Video",
     video_id: "video-123",
     viewer_id: "viewer-456",
   };
   
   // Configure FastPix data integration
   const fastPixShakaIntegration = loadShakaPlayer(
     player,
     {
       debug: true, // Recommended for bug reporting to capture detailed logs
       data: playerMetadata,
     },
     shaka,
   );
   
   // Load video content
   const videoUrl = "https://example.com/video.m3u8";
   player.load(videoUrl);
   
   // Your code here that causes the issue
   ```

3. **Expected Behavior:**

    ```
    <!-- Describe what you expected to happen -->
    ```

4. **Actual Behavior:**

    ```
    <!-- Describe what actually happened -->
    ```

5. **Error Messages/Logs:**
   ```
   <!-- Paste any error messages, stack traces, or logs here -->
   ```

## Debugging Information

### Console Output
```
<!-- Paste the complete console output here -->
```

### Error Stack Traces
```javascript
// Complete stack trace for JavaScript/TypeScript errors
// Example: Shaka Player error
shaka.util.Error {
  category: 2,
  code: 1002,
  severity: 2,
  message: "SHAKA.NETWORK_TIMEOUT",
  data: []
    at Error (native)
    at shaka.net.NetworkingEngine.onTimeout (...)
    ...

// Example: FastPix SDK error
Error: A valid Shaka Player instance is required to enable data analytics tracking.
    at loadShakaPlayer (.../node_modules/@fastpix/video-data-shakaplayer/dist/index.mjs:214:22)
    at initializePlayer (.../src/player.js:45:8)
```

### Network Requests
```http
# Raw HTTP request (remove sensitive headers)
POST https://data.fastpix.io/v1/events HTTP/1.1
Host: data.fastpix.io
Content-Type: application/json

{
  "workspace_id": "***",
  "event_type": "playerReady",
  "timestamp": 1234567890
}
```

### Screenshots
<!-- If applicable, please attach screenshots that help explain your issue -->

## Additional Context

### Configuration
```javascript
// Please share your SDK configuration (remove sensitive information)
const playerMetadata = {
  workspace_id: "***",
  player_name: "MyVideoPlayer",
  player_init_time: initTime,
  video_title: "Test Video",
  video_id: "video-123",
  viewer_id: "viewer-456",
};

const fastPixShakaIntegration = loadShakaPlayer(
  player,
  {
    debug: false,
    disableCookies: false,
    respectDoNotTrack: false,
    automaticErrorTracking: true,
    data: playerMetadata,
  },
  shaka,
);
```

### Workarounds
<!-- If you've found any workarounds, please describe them here -->

## Priority
Please indicate the priority of this bug:

- [ ] Critical (Blocks production use)
- [ ] High (Significant impact on functionality)
- [ ] Medium (Minor impact)
- [ ] Low (Nice to have)

## Checklist
Before submitting, please ensure:

- [ ] I have searched existing issues to avoid duplicates
- [ ] I have provided all required information
- [ ] I have tested with the latest SDK version
- [ ] I have removed any sensitive information
- [ ] I have provided a minimal reproduction case
- [ ] I have checked the documentation

---

**Thank you for helping improve the FastPix Video Data SDK for Shaka Player! 🚀**
