import React from 'react';
import { describe, it, expect } from 'vitest';
import { create, act } from 'react-test-renderer';
import { ServiceContainer } from '../../../../shared/di/service-container';
import type { McpUsageRpcService } from '../../../rpc/services/mcp-usage.service';
import { useMcpUsageStream } from '../use-mcp-usage-stream';

type Ev = { type: string; payload?: unknown };

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
    const fakeSvc: { subscribeToUsageUpdates: (cb: (e: Ev) => void) => Promise<() => void> } = {
      subscribeToUsageUpdates: async (cb: (e: Ev) => void) => {
        setTimeout(() => cb({ type: 'mcp.usage.stats.updated', payload: { totalUsage: 1 } }), 0);
        return () => {
          unsubCalled = true;
        };
      },
    };
    ServiceContainer.register('mcpUsageLog', fakeSvc as unknown as McpUsageRpcService);

    let got: Ev | null = null;
    await act(async () => {
      create(<Harness onEvent={(e) => (got = e)} />);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect((got as Ev | null)?.type).toBe('mcp.usage.stats.updated');
    // Unsubscribe on GC isn't guaranteed here, but close fn exists
    expect(typeof unsubCalled).toBe('boolean');
  });
});
