# RPC & Streaming Guide (GUI)

This is the single source guide for Renderer↔Main RPC usage in GUI, including streaming and cancellation patterns.

- Canonical guide: `apps/gui/docs/rpc/GUIDE.md`
- Index: `apps/gui/docs/rpc/README.md`

Contents overview:

- Transport: `RpcTransportFactory` builds a Frame transport over `window.electronBridge` (Electron preload) and wires `RpcEndpoint`.
- Streaming: Use contract `streamResponse` channels; unsubscribe to avoid leaks.
- Cancellation: Propagate cancel via channel semantics; ensure handlers stop emitting.

For detailed recipes and examples, see `apps/gui/docs/rpc/GUIDE.md` and `apps/gui/docs/rpc/recipes.md`.
