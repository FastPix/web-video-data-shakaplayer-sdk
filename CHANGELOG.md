# Changelog

All notable changes to this project will be documented in this file.

## [1.0.7]

> Requires `@fastpix/video-data-core` **1.1.0 or newer**. The player state reader
> calls `buildRenditionName`, `observeViewability`, `identifyStreamingProtocol`
> and `measureBufferLength` from `utilityMethods`
> data is collected, so the dependency range must be raised before publishing.

### Added
- **Complete rendition reporting** - `video_source_width`, `video_source_height`, `video_source_audio_codec`, `video_source_audio_bitrate`, `video_source_dynamic_range_type` and `video_source_rendition_name` alongside the bitrate, codec and frame rate already sent. Every field is read from the one active variant track, so a beacon can never pair one rendition's bitrate with another's resolution. This also switches on the counters the core derives from them: `view_rendition_upshift_count`, `view_rendition_downshift_count`, `video_source_bitrate_shift`, the `view_initial_*` set and the upscale/downscale percentages.
- **Player state fields** - `video_source_stream_protocol`, `video_source_buffer_length`, `player_program_date_time`, `player_viewable_on` and `player_viewable_percentage`.
- **Ad tracking** - one subscription to Shaka's advertisement manager covers HLS and DASH interstitials, client-side IMA, server-side DAI and AWS MediaTailor. Reports break identity, position and duration, per-advertisement identity, index, duration and serving host, impressions, attempt and error counters, and preroll request and load timing. Needs **Shaka 4.10 or newer**; interstitials did not exist before then, so on an older build no advertisement event is raised and the fields stay absent.
- **Pass-through metadata** - the core's full set is now reachable from this adapter, including `application_name`, `page_type`, the three `viewer_plan*` fields, the `video_*` title fields, DRM level, CDN edge and origin, and the captions and picture-in-picture capability flags. All optional; an omitted field is absent rather than empty.

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
