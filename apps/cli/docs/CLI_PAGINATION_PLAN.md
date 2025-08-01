# CLI Pagination Plan

## Requirements

- Add a reusable pagination helper to simplify looping over paginated APIs.
- Provide a `sessions` command in `agentos` CLI that lists existing chat sessions page by page.
- Allow navigating forward and backward through the session list. Selecting a session should open its message history browser.
- Update the existing history command to display messages page by page using the new pagination helper and provide previous/next controls.
- Document the new command and update help text.

## Interface Sketch

```ts
// packages/cli/src/pagination.ts
export async function* paginate<T>(
  fetch: (cursor?: string) => Promise<CursorPaginationResult<T>>,
  limit?: number,
): AsyncGenerator<T[]>;

// packages/cli/src/sessions.ts
export async function browseSessions(): Promise<void>;

// packages/cli/src/history.ts
export async function browseHistory(sessionId: string): Promise<void>;
```

## Todo

- [ ] Implement `paginate` helper
- [ ] Implement `browseSessions` and `browseHistory`
- [ ] Update `showHistory` to delegate to `browseHistory`
- [ ] Expose new `sessions` command in CLI entry
- [ ] Extend README with command usage
- [ ] Run `pnpm lint` and `pnpm test`

## Steps

1. Create `pagination.ts` implementing the async generator.
2. Implement `browseHistory` using `paginate` for `ChatSession.getHistories`.
3. Implement `browseSessions` listing all sessions via `ChatManager.list()` and navigating pages, calling `browseHistory` when a session is selected.
4. Update `index.ts` to wire up the `sessions` command.
5. Update README CLI section.
6. Run lint and tests.
