# GUI Implementation Patterns (Required)

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

## 6) Composition Hooks
- Prefer composite hooks to reduce N+1 fetch patterns (e.g., `useInstalledBridges` for ids→configs).
- Keep query options (`staleTime`, `enabled`) near the hook to maintain behavior consistency.

## 7) App-Level Data Integration
- Containers accept app-level actions/state through props (e.g., `reloadAgents`).
- Avoid hidden global coupling; favor explicit props for cross-feature synchronization.

By following these patterns, we ensure consistent, maintainable GUI code that cleanly separates data orchestration from presentation.
