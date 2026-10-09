# Changelog

All notable changes to this project will be documented in this file.

## [1.0.7]

> Requires `@fastpix/video-data-core` **1.1.0 or newer**.

### Added
- **Rendition tracking** - `view_rendition_upshift_count`, `view_rendition_downshift_count`, `view_last_rendition_changed_time`,`video_source_rendition_name` and initial-bitrate capture on both HLS and DASH.
- **Viewer environment fields** - browser viewport dimensions, cookies-enabled, and Do Not Track.
- **Player state fields** - mute, volume, loop, playback rate, viewable percentage, and picture-in-picture usage.
- **New pass-through metadata** - `application_name`, `application_version`, `page_type`, the three `viewer_plan*` fields, eight `video_*` title fields, DRM level, CDN edge/origin, time-shift and captions/PiP capability flags.

## [1.0.6]
### Security
- Hardened the test harness against SonarQube findings with code sanitization and safer input handling, ensuring user-provided manifest URLs are trimmed and validated before playback.
- Added Subresource Integrity (SRI) hash and `crossorigin` attribute to the Shaka Player CDN script to prevent tampered third-party code from executing.

### Changed
- Replaced `window` references with `globalThis` for safer, environment-agnostic global access.
- Refactored player lifecycle handling with dedicated load/destroy controls and proper teardown to avoid resource leaks.
- Added Azure Pipelines configuration (`azure-pipelines.yaml`) and SonarQube project settings (`sonar-project.properties`) for automated code quality and static analysis.

## [1.0.5]
### Changed
- Updated `@fastpix/video-data-core` to the latest version (1.0.7).

## [1.0.4]
### Changed
- Updated npm authentication from Classic token to Granular token for improved security and fine-grained permissions.

## [1.0.3]
- Updated `package.json` to include additional keywords related to Shaka Player and video analytics.

## [1.0.2]
- Upgraded the Video Data Core SDK to the latest version.
- Updated readme.md with a redirection link for supported dimension parameters.

## [1.0.1]
- Updated Video Data Core SDK with minor fixes and improvements.

## [1.0.0]

### Added
- **Integration with Shaka Player**:
  - Enabled video performance tracking using the FastPix Data SDK for Shaka Player, providing detailed insights into user engagement, playback quality, and real-time streaming diagnostics.
  - Included robust error management and reporting capabilities for tracking playback issues specific to Shaka Player.
  - Supports customizable behavior, such as disabling cookies, respecting `Do Not Track` settings, and configuring advanced error handling for Shaka Player-specific events.
  - Added custom metadata support to allow users to pass optional fields (`video_id`, `video_title`, `video_duration`, etc.) for enhanced tracking and reporting.
  - Introduced event tracking for `videoChange` to handle seamless metadata updates during playback transitions within Shaka Player.
