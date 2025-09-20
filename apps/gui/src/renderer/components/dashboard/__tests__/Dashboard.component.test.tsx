import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReadonlyAgentMetadata, Preset } from '@agentos/core';
import { Dashboard } from '../Dashboard';
import { useDashboardStats } from '../../../hooks/queries/use-dashboard';
import { useMcpUsageStream } from '../../../hooks/queries/use-mcp-usage-stream';

vi.mock('../../../hooks/queries/use-dashboard', () => ({
  useDashboardStats: vi.fn(),
}));

vi.mock('../../../hooks/queries/use-mcp-usage-stream', () => ({
  useMcpUsageStream: vi.fn(),
}));

const useDashboardStatsMock = vi.mocked(useDashboardStats);
const useMcpUsageStreamMock = vi.mocked(useMcpUsageStream);

const agentsFixture: ReadonlyAgentMetadata[] = [
  {
    id: 'agent-active',
    name: 'Active Agent',
    description: '',
    icon: '',
    keywords: [],
    preset: {} as Preset,
    status: 'active',
    sessionCount: 0,
    usageCount: 0,
  },
  {
    id: 'agent-idle',
    name: 'Idle Agent',
    description: '',
    icon: '',
    keywords: [],
    preset: {} as Preset,
    status: 'idle',
    sessionCount: 0,
    usageCount: 0,
  },
];

const presetsFixture: Preset[] = [
  {
    id: 'preset-1',
    name: 'Preset One',
    description: '',
    author: 'system',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    version: '1.0.0',
    systemPrompt: '',
    llmBridgeName: 'bridge',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: ['general'],
  },
];

function renderDashboard(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <Dashboard
        presets={presetsFixture}
        currentAgents={agentsFixture}
        loading={false}
        onCreateAgent={() => {}}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useDashboardStatsMock.mockReset();
  useMcpUsageStreamMock.mockReset();
});

describe('Dashboard component', () => {
  it('uses fallback counts while stats are loading', async () => {
    useDashboardStatsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useDashboardStats>);
    useMcpUsageStreamMock.mockReturnValue({ lastEvent: null });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderDashboard(qc);

    expect(await screen.findByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1 active')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry-agents/i })).toBeNull();
    qc.clear();
  });

  it('shows retry button and invalidates stats on click', async () => {
    useDashboardStatsMock.mockReturnValue({
      data: {
        activeChats: 5,
        agents: { total: 4, active: 2 },
        bridges: { total: 3, models: 6 },
        presets: { total: 6, inUse: 2 },
        mcp24h: { requests: 10 },
        meta: {
          agentsOk: false,
          bridgesOk: true,
          chatsOk: true,
          presetsOk: true,
          mcpOk: true,
          mcpHourlyOk: true,
        },
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardStats>);
    useMcpUsageStreamMock.mockReturnValue({ lastEvent: null });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    renderDashboard(qc);

    const retryButton = await screen.findByRole('button', { name: /retry-agents/i });
    fireEvent.click(retryButton);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'stats'] });
    qc.clear();
  });

  it('invalidates stats when MCP usage events arrive', async () => {
    useDashboardStatsMock.mockReturnValue({
      data: {
        activeChats: 0,
        agents: { total: 0, active: 0 },
        bridges: { total: 0, models: 0 },
        presets: { total: 0, inUse: 0 },
        mcp24h: { requests: null },
        meta: {
          agentsOk: true,
          bridgesOk: true,
          chatsOk: true,
          presetsOk: true,
          mcpOk: true,
          mcpHourlyOk: true,
        },
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardStats>);
    useMcpUsageStreamMock.mockReturnValue({
      lastEvent: {
        type: 'metadata-updated',
        clientName: 'mock-client',
        timestamp: new Date(),
        metadata: {},
      },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    renderDashboard(qc);

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'stats'] })
    );
    qc.clear();
  });
});
