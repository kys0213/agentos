// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import type { z } from 'zod';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';

export class McpClient {
  constructor(private readonly transport: RpcClient) {}

  methods(payload: z.input<typeof C.methods['methods'].payload>): Promise<void> {
    return this.transport.request(C.methods['methods'].channel, payload);
  }

  invokeTool(payload: z.input<typeof C.methods['invokeTool'].payload>): Promise<void> {
    return this.transport.request(C.methods['invokeTool'].channel, payload);
  }
}
