# CLI Bootstrap Plan

## Requirements
- Avoid recreating `ChatManager` and related components each time a CLI command runs.
- Provide a bootstrap function assembling singletons on startup.
- Use dependency injection by passing the `ChatManager` instance to command handlers.
- Update existing CLI command modules to accept the injected manager.

## Interface Sketch
```ts
// packages/cli/src/bootstrap.ts
export interface AppContext {
  chatManager: ChatManager;
}
export function bootstrap(): AppContext;

// packages/cli/src/chat.ts
export async function interactiveChat(manager: ChatManager): Promise<void>;
```
Other command modules (`history.ts`, `sessions.ts`, `browse.ts`) will have similar signatures that receive `ChatManager`.

## Todo
- [ ] Implement `bootstrap` that creates a singleton `ChatManager`.
- [ ] Refactor `interactiveChat`, `browseHistory`, and `browseSessions` to accept `ChatManager`.
- [ ] Update callers in `index.ts` and between modules.
- [ ] Ensure existing exports remain (e.g. `showHistory`).
- [ ] Run `pnpm lint`, `pnpm build`, and `pnpm test`.

## Steps
1. Create `packages/cli/src/bootstrap.ts` returning an `AppContext` with a singleton `ChatManager` using existing factory logic.
2. Modify command modules (`chat.ts`, `history.ts`, `sessions.ts`, `browse.ts`) to accept a `ChatManager` parameter instead of creating one internally.
3. Update internal calls and CLI entry (`index.ts`) to initialize context via `bootstrap()` once and pass the manager to command functions.
4. Export alias `showHistory` from `history.ts` unchanged for compatibility.
5. Run lint, build, and tests from repository root.
