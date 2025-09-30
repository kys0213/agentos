import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { create, act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { AgentServiceAdapter } from '../../../rpc/adapters/agent.adapter';
import { BridgeServiceAdapter } from '../../../rpc/adapters/bridge.adapter';
import { ConversationServiceAdapter } from '../../../rpc/adapters/conversation.adapter';
import { PresetServiceAdapter } from '../../../rpc/adapters/preset.adapter';
import { McpUsageRpcService } from '../../../rpc/services/mcp-usage.service';
import { useDashboardStats } from '../use-dashboard';
import type { AgentClient } from '../../../rpc/gen/agent.client';
import type { BridgeClient } from '../../../rpc/gen/bridge.client';
import type { ChatClient } from '../../../rpc/gen/chat.client';
import type { PresetClient } from '../../../rpc/gen/preset.client';
import type { ReadonlyAgentMetadata, Preset } from '@agentos/core';
import type { LlmManifest } from 'llm-bridge-spec';
import { z } from 'zod';
import type { RpcClient } from '../../../../shared/rpc/transport';
import { ChatContract as CC } from '../../../../shared/rpc/contracts/chat.contract';

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
    const agent = new AgentServiceAdapter({} as AgentClient);
    const basePreset: Preset = {
      id: 'p0',
      name: 'P',
      description: '',
      author: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1',
      systemPrompt: '',
      enabledMcps: [],
      llmBridgeName: 'test',
      llmBridgeConfig: {},
      status: 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
      category: [],
    };
    const m1: ReadonlyAgentMetadata = {
      id: 'a1',
      name: 'A1',
      description: 'x',
      icon: '',
      keywords: [],
      preset: basePreset,
      status: 'active',
      sessionCount: 0,
      usageCount: 2,
    } as ReadonlyAgentMetadata;
    const m2: ReadonlyAgentMetadata = {
      id: 'a2',
      name: 'A2',
      description: 'y',
      icon: '',
      keywords: [],
      preset: basePreset,
      status: 'idle',
      sessionCount: 0,
      usageCount: 1,
    } as ReadonlyAgentMetadata;
    Object.assign(agent, {
      getAllAgentMetadatas: async (): Promise<ReadonlyAgentMetadata[]> => [m1, m2],
    });
    const bridge = new BridgeServiceAdapter({} as BridgeClient);
    Object.assign(bridge, { getBridgeIds: async (): Promise<string[]> => ['b1'] });
    const manifest: LlmManifest = {
      schemaVersion: '1.0',
      name: 'dummy',
      language: 'ts',
      entry: 'index.js',
      configSchema: z.object({}),
      capabilities: {
        modalities: [],
        supportsToolCall: false,
        supportsFunctionCall: false,
        supportsMultiTurn: false,
        supportsStreaming: false,
        supportsVision: false,
      },
      models: [
        {
          name: 'm1',
          contextWindowTokens: 1000,
          pricing: { unit: 1, currency: 'USD', prompt: 0, completion: 0 },
        },
        {
          name: 'm2',
          contextWindowTokens: 1000,
          pricing: { unit: 1, currency: 'USD', prompt: 0, completion: 0 },
        },
      ],
      description: '',
    };
    Object.assign(bridge, {
      getBridgeConfig: async (_id: string): Promise<LlmManifest | null> => manifest,
    });
    const conversation = new ConversationServiceAdapter({} as ChatClient);
    type ListOut = z.output<(typeof CC.methods)['listSessions']['response']>;
    Object.assign(conversation, {
      listSessions: async (): Promise<ListOut> => ({
        items: [
          { id: 's1', title: 'S1', updatedAt: new Date() },
          { id: 's2', title: 'S2', updatedAt: new Date() },
        ],
        nextCursor: '',
        hasMore: false,
      }),
    });
    const preset = new PresetServiceAdapter({} as PresetClient);
    const preset1: Preset = { ...basePreset, id: 'p1', name: 'P1', usageCount: 3 };
    const preset2: Preset = { ...basePreset, id: 'p2', name: 'P2', usageCount: 0 };
    Object.assign(preset, {
      getAllPresets: async (): Promise<Preset[]> => [preset1, preset2],
    });
    const dummyTransport: RpcClient = {
      async request<TRes = unknown>(): Promise<TRes> {
        return undefined as never as TRes;
      },
      on<T = unknown>(_ch: string, _h: (p: T) => void) {
        return async () => {};
      },
    };
    const mcpUsage = new McpUsageRpcService(dummyTransport);
    Object.assign(mcpUsage, {
      getUsageStats: async () => ({ totalUsage: 5 }),
      getHourlyStats: async () => ({
        hourlyData: Array.from({ length: 24 }, (_, h) => [h, 1]),
      }),
    });

    ServiceContainer.register('agent', agent);
    ServiceContainer.register('bridge', bridge);
    ServiceContainer.register('conversation', conversation);
    ServiceContainer.register('preset', preset);
    ServiceContainer.register('mcpUsageLog', mcpUsage);

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
    if (!latest) {
      throw new Error('no data');
    }
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
