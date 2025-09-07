# Streaming Convention (Server ↔ Renderer)

This document specifies the streaming conventions for RPC methods and generated controllers/clients in the GUI app.

- Contracts are the single source of truth. All payloads and responses MUST be validated at runtime via `zod`.
- When a method emits multiple results over time, the server controller MUST return `Observable<z.output<ElemSchema>>` and MUST NOT wrap with `Promise`.
- Element schema: prefer concrete event schemas per stream (e.g., `McpUsageUpdateEventSchema`) instead of raw `unknown`.
- Unsubscription/cancellation: clients MUST unsubscribe and servers MUST teardown on complete/error or when unsubscribed.
- Generated clients SHOULD expose both `<name>Stream()` and `<name>On(handler)` helpers.

Guidelines

- Define `streamResponse` in the contract for streaming endpoints and bind it to a concrete schema (e.g., `usage.events.streamResponse: McpUsageUpdateEventSchema`).
- Codegen rule: if `streamResponse` exists, generate server stubs that return `Observable<z.output<...>>` and client helpers for stream/on.
- Do not co-erce streaming endpoints to request/response `Promise` shapes.

Related docs

- `apps/gui/docs/rpc/GUIDE.md`
- `apps/gui/docs/rpc/SPEC_FULL.md`
- `apps/gui/docs/rpc/ELECTRON_MCP_IPC_SPEC.md`

