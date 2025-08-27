This folder will contain TS+Zod contract sources that define RPC channels, payloads, and responses.

Codegen target (Phase A):

- renderer/rpc/gen/\*.client.ts — typed clients wrapping RpcClient
- main/_/gen/_.controller.ts — Nest EventPattern stubs (delegate to services)
- shared/rpc/gen/channels.ts — literal channel constants

Contracts should follow a defineContract() helper signature. PoC to be added in a follow-up.
