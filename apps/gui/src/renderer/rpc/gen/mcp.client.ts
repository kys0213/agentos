import type { RpcClient } from '../../../shared/rpc/transport';
import type { z } from 'zod';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';

/** AUTO-GENERATED FILE. DO NOT EDIT. */
export class McpClient {
  constructor(private readonly transport: RpcClient) {}

  getTool(name: string): Promise<z.output<typeof C.methods['getTool'].response>> {
    return this.transport.request(C.methods['getTool'].channel, { name });
  }
  invokeTool(
    name: string,
    input?: Record<string, unknown>,
    opts?: { agentId?: string; agentName?: string; resumptionToken?: string }
  ): Promise<z.output<typeof C.methods['invokeTool'].response>> {
    return this.transport.request(C.methods['invokeTool'].channel, { name, input, ...opts });
  }

  usage_getLogs(payload?: {
    query?: Record<string, unknown>;
    pg?: Record<string, unknown>;
  }): Promise<z.output<typeof C.methods['usage.getLogs'].response>> {
    return this.transport.request(C.methods['usage.getLogs'].channel, payload);
  }
  usage_getStats(payload?: { query?: Record<string, unknown> }): Promise<z.output<typeof C.methods['usage.getStats'].response>> {
    return this.transport.request(C.methods['usage.getStats'].channel, payload);
  }
  usage_getHourlyStats(
    date: Date,
    clientName?: string
  ): Promise<z.output<typeof C.methods['usage.getHourlyStats'].response>> {
    return this.transport.request(Channels.mcp.usage_getHourlyStats, {
      date: date.toISOString(),
      clientName,
    });
  }
  usage_clear(olderThan?: Date): Promise<z.output<typeof C.methods['usage.clear'].response>> {
    return this.transport.request(
      Channels.mcp.usage_clear,
      olderThan ? { olderThan: olderThan.toISOString() } : {}
    );
  }
}
