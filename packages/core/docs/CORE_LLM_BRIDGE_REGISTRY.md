# Core LLM Bridge Registry

A lightweight, reusable registry for installed LLM bridges (based on `llm-bridge-spec` manifests) and the active bridge id. This module provides shared contracts and a file-based implementation for apps to reuse.

## Concepts

- `BridgeId`: unique identifier for a bridge. Defaults to `manifest.name`.
- `InstalledBridgeRecord`: persisted `{ id, manifest, installedAt }`.
- `ActiveBridgeState`: `{ activeId, updatedAt }` stored separately.

## API

```ts
import { FileBasedLlmBridgeRegistry, LlmBridgeRegistry } from '@agentos/core';

const reg: LlmBridgeRegistry = new FileBasedLlmBridgeRegistry('/path/to/appdata');

// Register a bridge manifest
await reg.register(manifest); // id defaults to manifest.name

// List installed
const ids = await reg.listIds();
const summaries = await reg.listSummaries();

// Get manifest
const m = await reg.getManifest(ids[0]);

// Active id
await reg.setActiveId(ids[0]);
const active = await reg.getActiveId();
```

## Persistence Layout

```
<baseDir>/bridges/
  _active.json             # { activeId, updatedAt }
  <bridge-id>.json         # InstalledBridgeRecord (manifest + metadata)
```

## Notes

- The registry does not manage runtime `LlmBridge` instances; it only stores manifests and active id.
- Pricing/providers/endpoints/API keys are out of scope; integrate via separate catalog or settings.
- Pair with GUI Model Manager via IPC to display installed bridges and switch the active one.

