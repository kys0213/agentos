import type { CloseFn, RpcClient } from '../../../../shared/rpc/transport';
import { McpUsageRpcService } from '../mcp-usage.service';
import type { McpUsageUpdateEvent } from '../../../../shared/types/mcp-usage-types';

function createMockRpc(): {
  rpc: RpcClient;
  emit: (payload: unknown) => void;
  wasClosed: () => boolean;
} {
  let handler: ((payload: unknown) => void) | null = null;
  let closed = false;
  const rpc: RpcClient = {
    async request() {
      throw new Error('not used in this test');
    },
    on<T>(channel: string, h: (payload: T) => void): CloseFn {
      // ensure correct channel is used
      expect(channel).toBe('mcp.usage.events');
      handler = (payload: unknown) => h(payload as T);
      return async () => {
        closed = true;
        handler = null;
      };
    },
  };

  return {
    rpc,
    emit: (payload: unknown) => handler?.(payload),
    wasClosed: () => closed,
  };
}

describe('McpUsageRpcService.subscribeToUsageUpdates', () => {
  it('returns a CloseFn that unsubscribes without leaks and handlers receive valid events', async () => {
    const { rpc, emit, wasClosed } = createMockRpc();
    const service = new McpUsageRpcService(rpc);

    const cb = vi.fn();
    const close = await service.subscribeToUsageUpdates(cb);

    // emit a valid event (schema-compatible)
    const ev: McpUsageUpdateEvent = {
      type: 'usage-logged',
      clientName: 'demo',
      timestamp: new Date(),
      newLog: {
        id: '1',
        operation: 'tool.call',
        status: 'success',
        timestamp: new Date(),
      },
    };
    emit(ev);
    expect(cb).toHaveBeenCalledTimes(1);

    // unsubscribe and ensure underlying close executed
    await close();
    expect(wasClosed()).toBe(true);

    // further emits should not call callback
    emit(ev);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
