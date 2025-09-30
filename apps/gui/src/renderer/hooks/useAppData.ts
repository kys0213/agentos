import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseAppDataReturn } from '../stores/store-types';
import type { McpConfig, ReadonlyAgentMetadata, CreateAgentMetadata } from '@agentos/core';
import { ServiceContainer } from '../../shared/di/service-container';

export const AGENTS_QUERY_KEY = ['agents'] as const;
const CHAT_MENTIONABLE_QUERY_KEY = ['chat', 'mentionableAgents'] as const;
const CHAT_ACTIVE_QUERY_KEY = ['chat', 'activeAgents'] as const;

export const fetchAgents = async (): Promise<ReadonlyAgentMetadata[]> => {
  const agentService = ServiceContainer.getOrThrow('agent');
  return agentService.getAllAgentMetadatas();
};

/**
 * App data management hook backed by ServiceContainer services and React Query caches.
 * Replaces the design mock data store with live adapters while preserving the same API
 * surface for ManagementView and other consumers.
 */
export function useAppData(): UseAppDataReturn {
  const queryClient = useQueryClient();
  const [showEmptyState, setShowEmptyState] = useState(false);

  const {
    data: agents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: fetchAgents,
    staleTime: 60_000,
  });

  const currentAgents = useMemo<ReadonlyAgentMetadata[]>(
    () => (showEmptyState ? [] : agents),
    [agents, showEmptyState]
  );

  const mentionableAgents = useMemo(
    () => currentAgents.filter((agent) => agent.status === 'active' || agent.status === 'idle'),
    [currentAgents]
  );

  const activeAgents = useMemo(
    () => currentAgents.filter((agent) => agent.status === 'active'),
    [currentAgents]
  );

  const invalidateAgentQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CHAT_MENTIONABLE_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CHAT_ACTIVE_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const handleUpdateAgentStatus = useCallback(
    async (agentId: string, newStatus: ReadonlyAgentMetadata['status']) => {
      const agentService = ServiceContainer.getOrThrow('agent');
      await agentService.updateAgent(agentId, { status: newStatus });
      await invalidateAgentQueries();
    },
    [invalidateAgentQueries]
  );

  const handleCreateMCPTool = useCallback(async (mcpConfig: McpConfig): Promise<unknown> => {
    const mcpService = ServiceContainer.getOrThrow('mcp');
    await mcpService.connectMcp(mcpConfig);
    return mcpConfig;
  }, []);

  const handleCreateAgent = useCallback(
    async (newAgentData: CreateAgentMetadata): Promise<ReadonlyAgentMetadata> => {
      const agentService = ServiceContainer.getOrThrow('agent');
      const agent = await agentService.createAgent({
        name: newAgentData.name,
        description: newAgentData.description,
        preset: newAgentData.preset,
        status: newAgentData.status,
        icon: newAgentData.icon,
        keywords: newAgentData.keywords,
      });
      await invalidateAgentQueries();
      return agent;
    },
    [invalidateAgentQueries]
  );

  const handleCreateCustomTool = useCallback(async (toolData: unknown): Promise<unknown> => {
    // TODO: CustomTool service wiring will be added when the backend contract is ready.
    return toolData;
  }, []);

  const getMentionableAgents = useCallback(() => mentionableAgents, [mentionableAgents]);
  const getActiveAgents = useCallback(() => activeAgents, [activeAgents]);

  const reloadAgents = useCallback(async () => {
    await invalidateAgentQueries();
  }, [invalidateAgentQueries]);

  return {
    currentAgents,
    mentionableAgents,
    activeAgents,
    showEmptyState,
    setShowEmptyState,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    handleUpdateAgentStatus,
    handleCreateMCPTool,
    handleCreateAgent,
    handleCreateCustomTool,
    getMentionableAgents,
    getActiveAgents,
    reloadAgents,
  };
}
