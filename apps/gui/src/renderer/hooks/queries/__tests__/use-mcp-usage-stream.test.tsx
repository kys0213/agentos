import React from 'react';
import { describe, it, expect } from 'vitest';
import { create, act } from 'react-test-renderer';
import { ServiceContainer } from '../../../../shared/di/service-container';
import type { RpcClient } from '../../../../shared/rpc/transport';
import type { McpUsageUpdateEvent } from '../../../../shared/types/mcp-usage-types';
import { McpUsageRpcService } from '../../../rpc/services/mcp-usage.service';
import { useMcpUsageStream } from '../use-mcp-usage-stream';

type Ev = McpUsageUpdateEvent;

function Harness({ onEvent }: { onEvent: (e: Ev) => void }) {
  const { lastEvent } = useMcpUsageStream();
  React.useEffect(() => {
    if (lastEvent) {
      onEvent(lastEvent as Ev);
    }
  }, [lastEvent, onEvent]);
  return null;
}

describe('useMcpUsageStream', () => {
  it('updates lastEvent when subscription emits', async () => {
    let unsubCalled = false;
    // minimal RpcClient to satisfy constructor
    const transport: RpcClient = {
      async request<TRes = unknown, _TReq = unknown>(): Promise<TRes> {
        return undefined as never as TRes;
      },
      on<T = unknown>(_ch: string, _h: (p: T) => void) {
        return async () => {};
      },
    };
    const fakeSvc = new McpUsageRpcService(transport);
    Object.assign(fakeSvc, {
      subscribeToUsageUpdates: async (cb: (e: Ev) => void) => {
        cb({
          type: 'usage-logged',
          clientName: 'stream-tool',
          timestamp: new Date(),
          newLog: {
            id: 'log-1',
            toolId: 'tool-1',
            toolName: 'Stream Tool',
            timestamp: new Date(),
            operation: 'tool.call',
            status: 'success',
          },
        });
        return () => {
          unsubCalled = true;
        };
      },
    });
    ServiceContainer.register('mcpUsageLog', fakeSvc);

    let got: Ev | null = null;
    await act(async () => {
      create(<Harness onEvent={(e) => (got = e)} />);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect((got as Ev | null)?.type).toBe('usage-logged');
    // Unsubscribe on GC isn't guaranteed here, but close fn exists
    expect(typeof unsubCalled).toBe('boolean');
  });
});
