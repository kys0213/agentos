# GUI Implementation Patterns (Required)

Canonical location. Index: `apps/gui/docs/frontend/README.md`

This document defines mandatory patterns for GUI implementation to keep the codebase consistent, testable, and type-safe.

## 1) Container vs Presentational Components

- Presentational components (e.g., `ModelManager`, `SubAgentManager`) receive all state and callbacks via props.
- Containers (e.g., `ModelManagerContainer`, `PresetManagerContainer`) are responsible for:
  - Wiring React Query hooks/fetchers and ServiceContainer calls
  - Injecting callbacks (e.g., `onRefresh`, `onBridgeSwitch`) and domain actions
  - Handling query invalidation, navigation side-effects, and cross-feature sync (e.g., `reloadAgents`)

## 2) React Query Keys & Invalidation

- Centralize keys under a single module (e.g., `BRIDGE_QK`).
- Mutations must invalidate the minimal set of keys to reflect new state:
  - Bridge switch: invalidate `current`, `ids`, `list`
  - Register/unregister: invalidate `ids`, `list` (and `current` for unregister)
- Presentational components must not call `useQueryClient()` directly. Inject a refresh action via props instead.

Cross‑refs

- Naming guidance lives in `frontend/code-style.md`.
- See `frontend/testing.md` for how to assert cache effects without reaching into internals.

## 3) Service Access & IPC Contracts

- Do not access `ServiceContainer` directly in presentational components.
- Containers or hooks manage IPC calls and map results into view models.
- Keep Spec-aligned types at the boundary (e.g., `LlmManifest` from `llm-bridge-spec`).

## 4) Error/Loading/Empty UX

- Use consistent skeletons/alerts.
- Error and empty states are part of the presentational component props; containers determine when to render them.

## 5) Type Safety

- No `any`. Use concrete types, generics, or `unknown` with guards.
- Utilities (e.g., `toCapabilityLabels`) belong in `hooks/queries/*` or a shared utils module.

Enforcement

- ESLint: `@typescript-eslint/no-explicit-any` = error (tests may be warn), `no-restricted-syntax` bans `as any`.
- Zod at boundaries: parse contract responses and input payloads; prefer `z.unknown()` over `z.any()`.
- Promote discriminated unions where it models runtime (e.g., usage events).

## 6) Composition Hooks

- Prefer composite hooks to reduce N+1 fetch patterns (e.g., `useInstalledBridges` for ids→configs).
- Keep query options (`staleTime`, `enabled`) near the hook to maintain behavior consistency.

## 7) App-Level Data Integration

- Containers accept app-level actions/state through props (e.g., `reloadAgents`).
- Avoid hidden global coupling; favor explicit props for cross-feature synchronization.

By following these patterns, we ensure consistent, maintainable GUI code that cleanly separates data orchestration from presentation.

---

## 8) LLM Bridge Integration (Interfaces)

Interface-first summary for Model Manager ↔ Bridge integration.

- Service contracts (renderer, via DI):
  - `bridge.registerBridge(config: LlmManifest)`
  - `bridge.unregisterBridge(id: string)`
  - `bridge.switchBridge(id: string)`
  - `bridge.getCurrentBridge(): { id: string; config: LlmManifest } | null`
  - `bridge.getBridgeIds(): string[]`
  - `bridge.getBridgeConfig(id: string): LlmManifest | null`

- React Query keys (BRIDGE_QK):
  - `current`: `['bridge','current']`
  - `ids`: `['bridge','ids']`
  - `config(id)`: `['bridge','config', id]`
  - `list`: composed list from ids + manifests

- Hooks (recommended):
  - `useInstalledBridges()` → loads composed list into `BRIDGE_QK.list`
  - `useCurrentBridge()` → active bridge snapshot
  - Mutations: `useSwitchBridge()`, `useRegisterBridge()`, `useUnregisterBridge()`
    - Invalidate minimal keys: switch → `current, ids, list`; unregister → `ids, list, current`

- Acceptance criteria:
  - Presentational components never access ServiceContainer directly
  - Loading/error/empty states passed as props; containers control when to render them
  - Type-safety: spec-aligned `LlmManifest`, no `any`

- Usage scenarios:
  - ModelManager composes list/current via hooks
  - Settings screens reuse hooks and invalidation strategy

Note: Implementation is non-normative; rely on IPC contracts documented in `ELECTRON_MCP_IPC_SPEC.md` and terms in `IPC_TERMS_AND_CHANNELS.md`.

---

## 9) Chat Containers — Consolidation Outcomes

- ChatView props streamlined: remove redundant `agents` prop; use `mentionableAgents` as the single list source.
- Status counters derived via memo (idle/inactive) to avoid repeated filters.
- ChatHistory wrapped in `React.memo` to reduce re-renders.
- Containers own React Query wiring and session id continuity (map by agent id).
- Presentational Chat components remain prop-driven; no direct ServiceContainer access.
Testing hooks

- Prefer rendering presentational components with explicit props over mounting containers.
- For container logic (e.g., session id continuity), cover with focused hook tests or unit tests that assert invalidation and side‑effects.

Related docs

- Testing guide and MCP scenario: `frontend/testing.md`
- Roadmap phases summary: `frontend/roadmap.md`
