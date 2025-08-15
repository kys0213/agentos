# Model Manager ↔ Main Bridge Integration

This change refactors the GUI Model Manager to display installed LLM bridges from the Electron main process using the llm-bridge-spec manifest as the source of truth.

## What Changed

- Instances tab now lists installed bridges from IPC (`bridge:get-ids` + `bridge:get-config`).
- Active bridge shows as "online"; others show as "offline" (derived from `bridge:get-current`).
- Capabilities badges are mapped from `LlmManifest.capabilities`:
  - `modalities`: `text`, `image`, `audio`, `video`, `file`
  - supports: `tool-call`, `function-call`, `multi-turn`, `streaming`, `vision`
- Marketplace tab is simplified with a placeholder card (catalog coming later).
- Empty state appears when no bridges are installed.

## How It Works

1. `getBridgeIds()` returns installed bridge IDs (usually `manifest.name`).
2. For each ID, `getBridgeConfig(id)` returns the `LlmManifest`.
3. `getCurrentBridge()` determines the active ID for status mapping.

## React Query Hooks and Keys

- Keys: `BRIDGE_QK`
  - `current`: `['bridge','current']`
  - `ids`: `['bridge','ids']`
  - `config(id)`: `['bridge','config',id]`
  - `list`: `['bridge','list']` (composed list: ids + manifests)

- Hooks:
  - `useInstalledBridges()` → loads composed list, caches under `BRIDGE_QK.list`
  - `useCurrentBridge()` → active bridge
  - `useSwitchBridge()` → invalidates `current`, `ids`, `list`
  - `useRegisterBridge()` / `useUnregisterBridge()` → invalidates `ids`, `list` (and `current` for unregister)

This enables ModelManager and settings screens to refresh consistently without manual wiring.

## Electron IPC Contract

- `bridge.registerBridge(config: LlmManifest)`
- `bridge.unregisterBridge(id: string)`
- `bridge.switchBridge(id: string)`
- `bridge.getCurrentBridge(): { id: string; config: LlmManifest } | null`
- `bridge.getBridgeIds(): string[]`
- `bridge.getBridgeConfig(id: string): LlmManifest | null`

## Limitations (By Design)

- Pricing/provider/endpoint/API keys are outside of `LlmManifest` and not displayed.
- Usage/analytics are placeholder until usage tracking is wired in.

## Dev Notes

- UI code: `apps/gui/src/renderer/components/llm/ModelManager.tsx`
- Plan: `apps/gui/plan/model-manager-bridge-integration.md`
- Main IPC handlers: `apps/gui/src/main/services/bridge-ipc-handlers.ts`
