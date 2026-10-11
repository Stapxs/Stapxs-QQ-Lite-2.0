# Merged forward message normalization

## Scope

Merged forward cards use the existing inline preview and `MergePan` viewer. This
document covers the response mapping and node normalization shared by Web and
desktop renderers. It does not change forwarding actions or backend API names.

## Backend formats

- NapCat returns `data.messages` with each node's segments in `message`.
- LLOneBot returns `data.messages` with segments in `content` and the sender in
  `sender`. This is confirmed in [GetForwardMsg.ts at v7.12.14](https://github.com/LLOneBot/LuckyLilliaBot/blob/v7.12.14/src/onebot11/action/go-cqhttp/GetForwardMsg.ts).
  `content` can be an array or CQ-code string according to the backend's message
  format. The shared `NapCat.Onebot` path map must preserve both fields.
- The Lagrange map extracts `data.message[*].data`; these nodes use `content` and
  top-level `user_id` / `nickname` fields.

## Internal contract

`parseMsgList` promotes `content` to `message` before selecting array or CQ-code
parsing. An existing non-null `message` takes precedence, and the node's
`content` alias is removed. Existing `sender` data is preserved; a sender object
is constructed from top-level fields only when no sender is present.

This normalization is independent of `message_value` mappings. Those mappings
only normalize segment fields; they must not control whether a node receives
its message body or overwrite a backend-provided sender. `getMessageList` then
preprocesses the normalized nodes, including nested forward cards, through the
existing code path. Inline forward content uses the same normalization.

## Regression checks

Run `yarn test:forward-message` (included in `yarn check`). The tests execute the
production mapper, parser and preprocessing function bodies using the shipped
YAML maps. They cover LLOneBot API and inline nodes, nested forwards, CQ-code
content, preserved sender data, NapCat media, Lagrange sender fallback, missing
value mappings and existing-message precedence. Run `yarn build` after checks;
use the Electron compile command when validating the shared desktop renderer.

Fixtures verify frontend compatibility. A real logged-in LLOneBot session is
still needed to verify backend retrieval of an actual QQ forward resource.
