import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { create, act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceContainer } from '../../../../shared/di/service-container';
import type { AgentServiceAdapter } from '../../../rpc/adapters/agent.adapter';
import type { BridgeServiceAdapter } from '../../../rpc/adapters/bridge.adapter';
import type { ConversationServiceAdapter } from '../../../rpc/adapters/conversation.adapter';
import type { PresetServiceAdapter } from '../../../rpc/adapters/preset.adapter';
import type { McpUsageRpcService } from '../../../rpc/services/mcp-usage.service';
import { useDashboardStats } from '../use-dashboard';

function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (predicate()) {
        return resolve();
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('timeout'));
      }
      setTimeout(tick, 10);
    };
    tick();
  });
}

type DS = {
  activeChats: number | null;
  agents: { total: number | null; active: number | null };
  bridges: { total: number | null; models: number | null };
  presets: { total: number | null; inUse: number | null };
  mcp?: { requests?: number | null };
  mcp24h?: { requests?: number | null };
};

function TestHarness({ onData }: { onData: (data: DS) => void }): React.ReactElement | null {
  const { data } = useDashboardStats();
  React.useEffect(() => {
    if (data) {
      onData(data as DS);
    }
  }, [data, onData]);
  return null;
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    ServiceContainer.clear();
  });

  it('computes stats from adapters and aggregates MCP 24h usage', async () => {
    const agent: {
      getAllAgentMetadatas: () => Promise<
        Array<{
          id: string;
          name: string;
          description: string;
          status: 'active' | 'idle' | 'inactive';
          usageCount: number;
          keywords: string[];
        }>
      >;
    } = {
      getAllAgentMetadatas: async () => [
        { id: 'a1', name: 'A1', description: 'x', status: 'active', usageCount: 2, keywords: [] },
        { id: 'a2', name: 'A2', description: 'y', status: 'idle', usageCount: 1, keywords: [] },
      ],
    };
    const bridge: {
      getBridgeIds: () => Promise<string[]>;
      getBridgeConfig: (id: string) => Promise<{ models?: string[] }>;
    } = {
      getBridgeIds: async () => ['b1'],
      getBridgeConfig: async (_id: string) => ({ models: ['m1', 'm2'] }),
    };
    const conversation: { listSessions: () => Promise<{ items: Array<{ id: string }> }> } = {
      listSessions: async () => ({ items: [{ id: 's1' }, { id: 's2' }] }),
    };
    const preset: {
      getAllPresets: () => Promise<Array<{ id: string; name: string; usageCount?: number }>>;
    } = {
      getAllPresets: async () => [
        { id: 'p1', name: 'P1', usageCount: 3 },
        { id: 'p2', name: 'P2', usageCount: 0 },
      ],
    };
    const mcpUsage: {
      getUsageStats: () => Promise<{ totalUsage: number }>;
      getHourlyStats: (d: Date) => Promise<{ hourlyData: Array<[number, number]> }>;
    } = {
      getUsageStats: async () => ({ totalUsage: 5 }),
      getHourlyStats: async () => ({ hourlyData: Array.from({ length: 24 }, (_, h) => [h, 1]) }),
    };

    ServiceContainer.register('agent', agent as unknown as AgentServiceAdapter);
    ServiceContainer.register('bridge', bridge as unknown as BridgeServiceAdapter);
    ServiceContainer.register('conversation', conversation as unknown as ConversationServiceAdapter);
    ServiceContainer.register('preset', preset as unknown as PresetServiceAdapter);
    ServiceContainer.register('mcpUsageLog', mcpUsage as unknown as McpUsageRpcService);

    const qc = new QueryClient();
    let latest: DS | null = null;
    await act(async () => {
      create(
        <QueryClientProvider client={qc}>
          <TestHarness onData={(d) => (latest = d)} />
        </QueryClientProvider>
      );
    });

    await waitFor(() => !!latest);

    expect(latest).toBeTruthy();
    if (!latest) throw new Error('no data');
    const v = latest as DS;
    expect(v.activeChats).toBe(2);
    expect(v.agents.total).toBe(2);
    expect(v.agents.active).toBe(1);
    expect(v.bridges.total).toBe(1);
    expect(v.bridges.models).toBe(2);
    expect(v.presets.total).toBe(2);
    expect(v.presets.inUse).toBe(1);
    expect(v.mcp?.requests).toBe(5);
    // 24 hourly data points, each 1 → 24 total
    expect(v.mcp24h?.requests).toBe(24);
  });
});
