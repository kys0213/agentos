// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';
import { z } from 'zod';

export class McpClient {
  constructor(private readonly transport: RpcClient) {}

  async getTool(payload: z.input<typeof C.methods['getTool']['payload']>): Promise<z.output<typeof C.methods['getTool']['response']>> {
    const parsedPayload = C.methods['getTool'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['getTool'].channel, parsedPayload);
    return C.methods['getTool'].response.parse(resp);
  }

  async invokeTool(payload: z.input<typeof C.methods['invokeTool']['payload']>): Promise<z.output<typeof C.methods['invokeTool']['response']>> {
    const parsedPayload = C.methods['invokeTool'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['invokeTool'].channel, parsedPayload);
    return C.methods['invokeTool'].response.parse(resp);
  }

  async usage_getLogs(payload: z.input<typeof C.methods['usage.getLogs']['payload']>): Promise<z.output<typeof C.methods['usage.getLogs']['response']>> {
    const parsedPayload = C.methods['usage.getLogs'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['usage.getLogs'].channel, parsedPayload);
    return C.methods['usage.getLogs'].response.parse(resp);
  }

  async usage_getStats(payload: z.input<typeof C.methods['usage.getStats']['payload']>): Promise<z.output<typeof C.methods['usage.getStats']['response']>> {
    const parsedPayload = C.methods['usage.getStats'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['usage.getStats'].channel, parsedPayload);
    return C.methods['usage.getStats'].response.parse(resp);
  }

  async usage_getHourlyStats(payload: z.input<typeof C.methods['usage.getHourlyStats']['payload']>): Promise<z.output<typeof C.methods['usage.getHourlyStats']['response']>> {
    const parsedPayload = C.methods['usage.getHourlyStats'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['usage.getHourlyStats'].channel, parsedPayload);
    return C.methods['usage.getHourlyStats'].response.parse(resp);
  }

  async usage_clear(payload: z.input<typeof C.methods['usage.clear']['payload']>): Promise<z.output<typeof C.methods['usage.clear']['response']>> {
    const parsedPayload = C.methods['usage.clear'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['usage.clear'].channel, parsedPayload);
    return C.methods['usage.clear'].response.parse(resp);
  }

  async *usage_eventsStream(): AsyncGenerator<z.output<typeof C.methods['usage.events']['streamResponse']>, void, unknown> {
    if (!this.transport.stream) return;
    for await (const ev of this.transport.stream<unknown>(C.methods['usage.events'].channel)) {
      yield C.methods['usage.events'].streamResponse.parse(ev);
    }
  }
  usage_eventsOn(handler: (ev: z.output<typeof C.methods['usage.events']['streamResponse']>) => void, onError?: (e: unknown) => void): CloseFn {
    return this.transport.on<unknown>(C.methods['usage.events'].channel, (payload) => handler(C.methods['usage.events'].streamResponse.parse(payload)), onError);
  }
}
