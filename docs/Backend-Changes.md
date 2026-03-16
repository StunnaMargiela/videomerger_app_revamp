# Backend Changes Log

## 2026-03-15

### Theme Feature Stabilization
- Scope: Theme reliability and UX polish request.
- Backend impact: No backend runtime logic changes required for this specific theme fix.
- Reason: Theme rendering is controlled by renderer state + CSS variable system and does not require IPC/service pipeline updates.
- Notes: Existing settings persistence (`get-settings` / `save-settings`) continues to store `appTheme` value.

### Sand Light Dark-Spot Cleanup
- Scope: Remove remaining dark visual patches in Settings/Arrange/Finalization for Sand Light.
- Backend impact: None.
- Reason: Fix implemented entirely in renderer CSS by replacing hardcoded dark colors with theme variables.

### Native Window Menu Removal
- Scope: Hide default Electron application menu strip (File/Edit/View/Window/Help).
- Backend impact: Electron window configuration update in main process (`BrowserWindow` options + menu visibility call).
- Reason: Align window chrome with custom in-app header design and remove duplicate top-level controls.

### Google Avatar Display in UI
- Scope: Show Google profile picture in header badge and Account tab.
- Backend impact: No additional backend changes required.
- Reason: Existing OAuth payload and persisted auth store already include `user.picture`; renderer now consumes and renders it.

### Guest Mode Forces OAuth Logout
- Scope: Ensure "Continue without account" truly enters guest mode.
- Backend impact: Uses existing `google-oauth-logout` IPC handler to clear persisted auth data before step transition.
- Reason: Prevent stale login state from previous runs when user intentionally skips account login.

### YouTube Account Summary IPC
- Scope: Support Account tab YouTube insights (channel link + recent videos).
- Backend impact:
	- Added `youtube-account-summary` IPC handler.
	- Added Google API helper requests to query channel info (`channels?mine=true`) and upload history (`playlistItems` from uploads playlist).
	- Added `open-external` IPC handler so renderer can open channel/video links safely via shell.
- Reason: Provide in-app visibility of the signed-in user's YouTube presence without leaving the app flow.

### YouTube Summary Reliability + Reauth Signaling
- Switched summary fetch flow to a more tolerant approach:
	- Channel details from `channels?part=snippet&mine=true`.
	- Recent uploads from `search?forMine=true&type=video&order=date`.
- Reduced hard failure cases by returning channel info even when recent-video query fails.
- Added friendly error mapping and `needsReauth` flag when token scope/permission issues are detected.

### Default Output Carry-Over (Finalize)
- Scope: Ensure configured default output location appears in Finalization before manual save selection.
- Backend impact: None.
- Reason: Fix is renderer-side state/display alignment using existing default-output settings and merge path logic.

### Real-Time Merge Progress Emission
- Scope: Make renderer progress bar move in real time during merge.
- Backend impact: Updated processing event parser in `VideoProcessingService` to consume Python CLI `PROGRESS: <n>` lines and emit true percentage updates.
- Added monotonic progress clamping (0..100) and forwarded INFO status lines as live progress messages.

### Progress Streaming Robustness
- Added unbuffered Python execution (`python -u`) in adapter to flush progress logs immediately.
- Updated service parser to handle multiple `PROGRESS:` tokens in a single stream chunk and emit the highest observed value.
- Result: reduced chunking/buffering artifacts that made progress appear to jump directly from 0 to completion.

### Preview Playback Consistency Stabilization
- Scope: intermittent in-app preview playback reliability in Arrange/Finalize.
- Backend impact: None.
- Reason: fix implemented in renderer video element lifecycle/keys and playback retry handling; no IPC/service/CLI changes required.

### Rapid-Cycling Preview Stability
- Scope: playback dropping/stalling after very fast clip switching in preview lists.
- Backend impact: None.
- Reason: handled entirely in renderer with player pause/reload/retry sequencing and selection-state handling.

### Local Video Protocol Range Forwarding
- Scope: intermittent preview stalls after rapid clip cycling/seek behavior.
- Backend impact: Electron main-process protocol handler update.
- Change: forwarded `Range` request header in `local-video` custom protocol to underlying file fetch.
- Reason: HTML5 video playback frequently depends on partial-content byte-range requests for stable load/start/seek behavior.

## 2026-03-16

### Richer YouTube Upload Metadata Support
- Scope: Broaden YouTube preset coverage to almost all common upload metadata fields.
- Backend impact:
	- Extended `upload-to-youtube` IPC options in main process.
	- Extended upload metadata payload to include category, tags, language, made-for-kids, license, embeddable, and public stats visibility.
	- Added `notifySubscribers` support in resumable upload initialization query.
- Reason: keep renderer preset/default schema aligned with actual YouTube upload options.

### Account-Scoped Online Preset Foundation (Pre-Firebase)
- Scope: Provide online preset save/load behavior tied to signed-in Google account before Firebase integration.
- Backend impact:
	- Added IPC handlers:
		- `youtube-online-presets-save`
		- `youtube-online-presets-load`
	- Added account-scoped storage map in Electron Store (`youtubeOnlinePresetsByUser`) keyed by normalized user email.
	- Added preload bridge exposure for save/load methods.
- Reason: establish stable IPC/data contract now so storage backend can later be swapped to Firebase with minimal UI changes.

### Preset Sync Verification Note
- Verified that current `youtube-online-presets-save/load` handlers are authenticated by Google login state and user email.
- Verified current persistence target is still local Electron Store (`youtubeOnlinePresetsByUser`) in main process.
- Result: feature currently behaves as account-scoped local persistence (pre-Firebase), not remote Firebase storage yet.

### YouTube Checkbox Visual Polish
- Scope: circular minimalist checkbox styling update in renderer YouTube forms.
- Backend impact: None.
- Reason: visual and layout changes are CSS/renderer-only with no IPC or service behavior changes.
