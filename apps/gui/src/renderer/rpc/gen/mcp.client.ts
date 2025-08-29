// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { z } from 'zod';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';

export class McpClient {
  constructor(private readonly transport: RpcClient) {}

  getTool(payload) {
    return this.transport.request(C.methods['getTool'].channel, payload);
  }

  invokeTool(payload) {
    return this.transport.request(C.methods['invokeTool'].channel, payload);
  }
}
