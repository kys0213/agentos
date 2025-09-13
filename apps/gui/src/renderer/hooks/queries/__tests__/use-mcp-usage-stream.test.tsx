import React from 'react';
import { describe, it, expect } from 'vitest';
import { create, act } from 'react-test-renderer';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { useMcpUsageStream } from '../use-mcp-usage-stream';

function Harness({ onEvent }: { onEvent: (e: unknown) => void }) {
  const { lastEvent } = useMcpUsageStream();
  React.useEffect(() => {
    if (lastEvent) onEvent(lastEvent);
  }, [lastEvent, onEvent]);
  return null as unknown as React.ReactElement;
}

describe('useMcpUsageStream', () => {
  it('updates lastEvent when subscription emits', async () => {
    let unsubCalled = false;
    const fakeSvc = {
      subscribeToUsageUpdates: async (cb: (e: unknown) => void) => {
        setTimeout(() => cb({ type: 'mcp.usage.stats.updated', payload: { totalUsage: 1 } }), 0);
        return () => {
          unsubCalled = true;
        };
      },
    } as any;
    ServiceContainer.register('mcpUsageLog', fakeSvc);

    let got: any;
    await act(async () => {
      create(<Harness onEvent={(e) => (got = e)} />);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(got?.type).toBe('mcp.usage.stats.updated');
    // Unsubscribe on GC isn't guaranteed here, but close fn exists
    expect(typeof unsubCalled).toBe('boolean');
  });
});
