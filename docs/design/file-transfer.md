# File transfer reliability

## Scope

This document covers chat file uploads and downloads across Web, Electron,
Tauri, and Capacitor. The path-map entry remains the capability boundary for
OneBot-specific upload extensions.

## Upload invariants

- Capture the destination chat before reading or uploading a file. An async
  result must never be sent to whichever chat happens to be visible later.
- Prefer `file_upload_stream` only when the active OneBot path map advertises
  it. Chunks are sent sequentially so memory and WebSocket payload size remain
  bounded.
- A failed or cancelled stream is reset on the OneBot side. Cancellation is
  checked again after stream finalization and before the completed path is
  passed to the mapped group/private upload action.
- Inline Base64 is a compatibility fallback for files no larger than 8 MiB.
  Larger files fail with an actionable error when streaming is unavailable;
  they must not be packed into one oversized WebSocket frame.
- A transfer task becomes completed only after OneBot reports success. A
  rejected OneBot response is a failed task, even if the browser finished
  reading the source file.
- The task enters a non-cancellable finalizing state immediately before the
  mapped OneBot send action. Once that action starts, the protocol cannot
  reliably retract the file, so the UI must not report a late cancellation.

## Download invariants

- Electron and Tauri events carry a transfer task ID. Progress, completion,
  cancellation, and failure events must be consumed only by the matching task.
- Tauri download commands start only after every asynchronous event listener
  reports that it is ready; terminal events must not race listener setup.
  Electron registers listeners synchronously.
- Native backends reduce remote file names to a base name before joining them
  to the user-selected download directory.
- Electron associates redirects through the complete URL chain, because the
  final `DownloadItem` URL can differ from the requested URL.
- Native downloads stream to disk and emit an explicit terminal event. Tauri
  cancellation stops the Rust stream, and Tauri removes a partial output file
  after cancellation, request failure, or write failure.
- Cross-origin Web downloads are delegated to the browser download manager.
  This avoids XHR CORS failures, whole-file buffering, and application-level
  timeouts. Delegated tasks cannot provide reliable in-app progress.
- Same-origin Web downloads retain in-app progress, have no fixed timeout, and
  surface Promise rejection instead of leaving a task permanently active.

## Compatibility boundaries

- The bundled Capacitor connector has no native download command or terminal
  events. Capacitor therefore uses the browser-managed path; cross-origin
  downloads are delegated and cannot report reliable in-app progress.
- Adding a streaming action to another OneBot implementation requires a path
  map entry with the action names and a safe chunk size. Do not infer support
  from a product name in UI code.
