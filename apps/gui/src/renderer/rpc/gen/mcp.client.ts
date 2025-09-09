// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';
import { z } from 'zod';

export class McpClient {
  constructor(private readonly transport: RpcClient) {}

  getTool(
    payload: z.input<(typeof C.methods)['getTool']['payload']>
  ): Promise<z.output<(typeof C.methods)['getTool']['response']>> {
    return this.transport.request(C.methods['getTool'].channel, payload);
  }

  invokeTool(
    payload: z.input<(typeof C.methods)['invokeTool']['payload']>
  ): Promise<z.output<(typeof C.methods)['invokeTool']['response']>> {
    return this.transport.request(C.methods['invokeTool'].channel, payload);
  }

  usage_getLogs(
    payload: z.input<(typeof C.methods)['usage.getLogs']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.getLogs']['response']>> {
    return this.transport.request(C.methods['usage.getLogs'].channel, payload);
  }

  usage_getStats(
    payload: z.input<(typeof C.methods)['usage.getStats']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.getStats']['response']>> {
    return this.transport.request(C.methods['usage.getStats'].channel, payload);
  }

  usage_getHourlyStats(
    payload: z.input<(typeof C.methods)['usage.getHourlyStats']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.getHourlyStats']['response']>> {
    return this.transport.request(C.methods['usage.getHourlyStats'].channel, payload);
  }

  usage_clear(
    payload: z.input<(typeof C.methods)['usage.clear']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.clear']['response']>> {
    return this.transport.request(C.methods['usage.clear'].channel, payload);
  }

  usage_eventsStream(): AsyncGenerator<
    z.output<(typeof C.methods)['usage.events']['streamResponse']>,
    void,
    unknown
  > {
    return this.transport.stream
      ? this.transport.stream<z.output<(typeof C.methods)['usage.events']['streamResponse']>>(
          C.methods['usage.events'].channel
        )
      : (async function* () {})();
  }
  usage_eventsOn(
    handler: (ev: z.output<(typeof C.methods)['usage.events']['streamResponse']>) => void
  ): CloseFn {
    return this.transport.on<z.output<(typeof C.methods)['usage.events']['streamResponse']>>(
      C.methods['usage.events'].channel,
      handler
    );
  }
}
