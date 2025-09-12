import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { create, act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { useDashboardStats } from '../use-dashboard';

function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
      setTimeout(tick, 10);
    };
    tick();
  });
}

function TestHarness({ onData }: { onData: (data: unknown) => void }) {
  const { data } = useDashboardStats();
  React.useEffect(() => {
    if (data) onData(data);
  }, [data, onData]);
  return null as unknown as React.ReactElement;
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    ServiceContainer.clear();
  });

  it('computes stats from adapters and aggregates MCP 24h usage', async () => {
    const agent = {
      getAllAgentMetadatas: async () => [
        { id: 'a1', name: 'A1', description: 'x', status: 'active', usageCount: 2, keywords: [] },
        { id: 'a2', name: 'A2', description: 'y', status: 'idle', usageCount: 1, keywords: [] },
      ],
    } as any;
    const bridge = {
      getBridgeIds: async () => ['b1'],
      getBridgeConfig: async (_id: string) => ({ models: ['m1', 'm2'] }),
    } as any;
    const conversation = {
      listSessions: async () => ({ items: [{ id: 's1' }, { id: 's2' }] }),
    } as any;
    const preset = {
      getAllPresets: async () => [
        { id: 'p1', name: 'P1', usageCount: 3 },
        { id: 'p2', name: 'P2', usageCount: 0 },
      ],
    } as any;
    const mcpUsage = {
      getUsageStats: async () => ({ totalUsage: 5 }),
      getHourlyStats: async () => ({ hourlyData: Array.from({ length: 24 }, (_, h) => [h, 1]) }),
    } as any;

    ServiceContainer.register('agent', agent);
    ServiceContainer.register('bridge', bridge);
    ServiceContainer.register('conversation', conversation);
    ServiceContainer.register('preset', preset);
    ServiceContainer.register('mcpUsageLog', mcpUsage);

    const qc = new QueryClient();
    let latest: any;
    await act(async () => {
      create(
        <QueryClientProvider client={qc}>
          <TestHarness onData={(d) => (latest = d)} />
        </QueryClientProvider>
      );
    });

    await waitFor(() => !!latest);

    expect(latest).toBeTruthy();
    expect(latest.activeChats).toBe(2);
    expect(latest.agents.total).toBe(2);
    expect(latest.agents.active).toBe(1);
    expect(latest.bridges.total).toBe(1);
    expect(latest.bridges.models).toBe(2);
    expect(latest.presets.total).toBe(2);
    expect(latest.presets.inUse).toBe(1);
    expect(latest.mcp.requests).toBe(5);
    // 24 hourly data points, each 1 → 24 total
    expect(latest.mcp24h.requests).toBe(24);
  });
});
