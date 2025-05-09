# Changelog

All notable changes to this project will be documented in this file.

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
