# RPC & Streaming Guide (GUI)

This is the single source guide for Renderer↔Main RPC usage in GUI, including streaming and cancellation patterns.

- Canonical guide: `docs/apps/gui/rpc/GUIDE.md`
- Index: `docs/apps/gui/rpc/README.md`

Contents overview:

- Transport: `RpcTransportFactory` builds a Frame transport over `window.electronBridge` (Electron preload) and wires `RpcEndpoint`.
- Streaming: Use contract `streamResponse` channels; unsubscribe to avoid leaks.
- Cancellation: Propagate cancel via channel semantics; ensure handlers stop emitting.

For detailed recipes and examples, see `docs/apps/gui/rpc/GUIDE.md` and `docs/apps/gui/rpc/recipes.md`.
