# GUI History Sidebar Plan

## Requirements

- Save chat messages using `@agentos/core` so conversations persist.
- Provide a sidebar menu in the React GUI listing previous sessions (id, title, updated date).
- Selecting a session loads its messages into the main chat view.
- Allow starting a new session from the sidebar.
- Keep ChatApp slim by extracting the sidebar into a separate `ChatSidebar` component.

## Interface Sketch

```ts
// packages/gui/src/renderer/chat-manager.ts
export function createChatManager(): ChatManager;

// packages/gui/src/renderer/ChatApp.tsx
// uses createChatManager() and maintains session state
// packages/gui/src/renderer/ChatSidebar.tsx
// displays previous sessions and controls switching
```

## Todo

- [x] Add `NoopCompressor` and `createChatManager` in renderer code.
- [x] Update `ChatApp` to persist messages via a `ChatSession`.
- [x] Fetch session list and display in a sidebar with open/new actions.
- [x] Load selected session history using `ChatSession.getHistories`.
- [x] Run `pnpm lint` and `pnpm test`.
- [x] Extract sidebar rendering into a new `ChatSidebar` component.

## Steps

1. Implement `NoopCompressor` and `createChatManager` similar to CLI's factory. ✅
2. Refactor `ChatApp` to create a manager and a session on mount. ✅
3. Add sidebar UI to list sessions and switch between them; load history when switching. ✅
4. Append and commit messages to the active session when chatting. ✅
5. Split out `ChatSidebar` component to keep `ChatApp` manageable. ✅
6. Update tests if needed and run lint/tests. ✅
