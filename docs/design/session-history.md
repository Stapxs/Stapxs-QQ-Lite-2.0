# Session history request lifecycle

## Scope

This design covers initial history, older pages and gap filling in the standard,
danmaku and terminal chat views. Live incoming messages and contact-preview
requests also use parts of the message pipeline but have different ownership.

## Request ownership

- Starting a fresh history load increments a generation and captures the chat
  ID and type. Normalize ID comparison without changing the contact objects.
- A response belongs to the active load only when its generation and chat
  identity both match. Chat ID alone cannot distinguish an A -> B -> A switch.
- Every initial, pagination and gap-fill callback carries this generation in
  its OneBot echo. Missing or malformed generations cannot modify history,
  loading/error state, persistence or scroll position.
- Local-cache reads and message normalization can finish after a chat switch.
  Recheck ownership after each asynchronous boundary and before applying the
  result or sending another request.
- Switching chats resets the pagination state so the previous chat's request
  cannot suppress the newly selected chat's initial load.

## Shared entry points and compatibility

- `loadHistory` starts a generation and reads local history before requesting
  fresh network history.
- `loadMoreHistoryMessages` is the pagination entry for all three chat views.
  It uses the active path map, retaining private/group actions, each view's
  page size and the full-page count convention.
- `loadHistoryMessage` numbers its default initial-history callback. Explicit
  unrelated callbacks such as `readMemberMessage` retain their existing echo.
- Gap filling carries both the active generation and its anchor message ID.
- History data updates do not require the standard view's `msgPan` element.
  Scroll adjustment is optional and checks both request ownership and the
  captured DOM element before changing its position.
- Catch normalization failures in both history callbacks and recheck request
  ownership before reporting failure or releasing pagination. A late rejection
  must not change the new chat's error/loading state.
- Catch background local-history persistence failures separately. A database
  write failure is logged without rejecting a successfully displayed response.
- `saveMsg` also appends live messages. Those calls do not require a history
  generation; they capture the destination chat before normalization and
  check it again afterwards.
- Retain mixed local/network merging, full-page replacement, timestamp
  boundaries and session-preview refresh. An exhausted incremental page must
  preserve visible messages and release its loading flag.

## Regression verification

Run `yarn test:session-switch`, `yarn check` and `yarn build` after changes.
The Node regression suite runs production history functions and the actual
alternate-view paging callbacks with controlled stores, asynchronous I/O and
schedulers. The helper uses the project's TypeScript compiler to select their
function bodies and loads the compiled module through Node's module loader
without initializing the browser application. Generated modules live under
the temporary `.agents` directory and are removed after loading.

Tests cover delayed cache reads, message normalization, error responses,
pagination, gap filling, scheduled scrolling, alternate views, path-map
compatibility and live incoming messages. They are controlled runtime tests;
they do not replace acceptance against a logged-in QQ/OneBot connection.

To reproduce the original defect, hold an A history response, switch to B and
release A's response. Repeat with A -> B -> A and a delayed local-cache read or
older-page response. B's messages and loading state, or the second A load, must
remain owned by the new generation.
