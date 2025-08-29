// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';
import type * as T from '../../../shared/rpc/gen/mcp.types';

export class McpClient {
  constructor(private readonly transport: RpcClient) {}

  getTool(payload: T.getTool_Payload): Promise<T.getTool_Result> {
    return this.transport.request(C.methods['getTool'].channel, payload);
  }

  invokeTool(payload: T.invokeTool_Payload): Promise<T.invokeTool_Result> {
    return this.transport.request(C.methods['invokeTool'].channel, payload);
  }

  (payload: T._Payload): Promise<T._Result> {
    return this.transport.request(C.methods[''].channel, payload);
  }

  usage_getStats(payload: T.usage_getStats_Payload): Promise<T.usage_getStats_Result> {
    return this.transport.request(C.methods['usage.getStats'].channel, payload);
  }

  usage_getHourlyStats(payload: T.usage_getHourlyStats_Payload): Promise<T.usage_getHourlyStats_Result> {
    return this.transport.request(C.methods['usage.getHourlyStats'].channel, payload);
  }

  usage_clear(payload: T.usage_clear_Payload): Promise<T.usage_clear_Result> {
    return this.transport.request(C.methods['usage.clear'].channel, payload);
  }

  usage_events(): Promise<T.usage_events_Stream> {
    return this.transport.request(C.methods['usage.events'].channel);
  }
}
