# Quoted messages and timeline navigation

## Scope and interaction

Keep the existing inline reply preview and timeline jump/highlight. Visible reply
cards resolve the original by ID even when it is outside loaded history. Clicking
an already rendered original jumps immediately. Otherwise one click automatically
loads successive older history pages until the original is rendered, then uses
the same timeline jump/highlight. The intervening history remains in the list.
There is no original-message dialog or separate card opened by clicking.

The existing top loading indicator shows navigation progress. Repeated/no-progress
pages, exhausted history or failed requests stop with the existing unavailable
context notice. Another jump, a chat/account/connection change or unmount cancels
navigation. Missing references inside merged forwards are not resolved against
the active conversation because their source chat is unknown.

## Preview ownership

- QuotedMessageLoader deduplicates string/number IDs, caps active requests at two,
  and retains at most 128 completed entries with LRU eviction. Failures stay
  stable until an explicit click retries them.
- The adapter invokes the map's single-message action or get_msg, with a
  10-second timeout, and normalizes through the existing preview pipeline.
  Validate status, ID, sender, timestamp and required message_type. The
  [OneBot 11 get_msg specification](https://github.com/botuniverse/onebot-11/blob/master/api/public.md)
  does not require group_id; validate that extension when supplied.
- The cache resets synchronously on connection/login, account, adapter or chat
  changes, including replacing the same chat object. Recheck its generation after
  network and normalization waits, including A -> B -> A.
- Confirmed recalls clear cached/in-flight content. Other failures are not treated
  as recalls. Compact previews omit nested replies and heavy attachments, with
  distinct DOM IDs so they cannot intercept the main chat-* jump lookup.

## Navigation and paging

- loadHistoryToQuotedMessage checks the rendered target after each page. It
  tracks the oldest message ID to stop duplicate pages, independently of live
  messages increasing the list length. It does not compare numeric message IDs.
- Chat.vue waits for existing paging before starting, blocks scroll-triggered
  duplicate paging during navigation, and retains the existing group/private
  action, 20-message page size and full-page count convention. One click drives
  all required pages; no repeated clicks or manual scrolling are required.
- Quote navigation uses the same history normalization/application path through
  appendHistoryForQuotedMessage. It checks the captured scope before and after
  asynchronous normalization, preventing late pages from populating another chat.
  This does not depend on PR #403's initial-history implementation.
- Paging starts from the network boundary, without launching unrelated local
  gap-fill callbacks during navigation. Normal manual mixed local/network paging
  keeps its existing behavior. Loaded pages still use the existing merge and
  persistence pipeline. Quote paging always retains existing messages, including
  when a full-page adapter responds with an older window rather than a cumulative
  list; normal full-page replacement outside quote navigation is unchanged.
- Scroll compensation completes before the final jump. Quote navigation does
  not schedule the normal history callback's delayed 200ms correction, which
  could otherwise overwrite the target position after it is highlighted.
  Quote jumps ask the existing scroll/highlight helper to center the target in
  the viewport; its legacy offset can hide the first original behind the chat
  header. Keep programmatic positioning just above the zero-scroll paging
  threshold so the final jump cannot launch a normal full-page replacement.
  Other callers retain their existing scroll position.
- A quote jump keeps the actual original anchored inside the visible area between
  the header and composer. Use current viewport rectangles rather than a cached
  offset; delayed images, quote previews and viewport resizing change layout after
  Vue's nextTick. Resize/load/transition events re-align that same element and
  scope, with immediate scrolling so a long smooth animation cannot be interrupted.
  While paging or anchored, image-load callbacks must not add every image's height
  to scrollTop: images below the original would move it off screen. Manual wheel,
  touch, pointer or scroll-key input releases the anchor. A new jump, chat scope
  change or unmount releases its observer, events and queued animation frame.

## Verification

Run yarn check and yarn build sequentially. Production-function tests cover
preview ownership plus loaded targets, multi-page navigation, render waits,
duplicate pages, exhaustion/failure and cancellation. Browser acceptance must
show an unloaded original in the inline quote, click once, load all required
pages and highlight the original in the main timeline without a dialog. Also
cover an already loaded original, end-of-history and switching chats during a
delayed page. Real logged-in QQ/NapCat acceptance remains separate from mocks.
Long-distance acceptance must also include delayed images both above and below
the original, a target whose height changes and manual scrolling after a jump.
