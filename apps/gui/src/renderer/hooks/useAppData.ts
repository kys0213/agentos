import { useState, useEffect } from 'react';
import type { UseAppDataReturn } from '../stores/store-types';
import type { McpConfig, ReadonlyAgentMetadata, CreateAgentMetadata } from '@agentos/core';
import { ServiceContainer } from '../../shared/di/service-container';

/**
 * App data management hook
 * ServiceContainer를 통해 Core 서비스와 연동하도록 재작성된 버전
 * Mock 데이터 대신 실제 Core 서비스를 사용
 */
export function useAppData(): UseAppDataReturn {
  const [currentAgents, setCurrentAgents] = useState<ReadonlyAgentMetadata[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 데이터를 다시 로드하는 함수 (Agent 생성 후 동기화용)
  const reloadAgents = async () => {
    try {
      if (ServiceContainer.has('agent')) {
        const agentService = ServiceContainer.getOrThrow('agent');
        const coreAgents = await agentService.getAllAgentMetadatas();
        setCurrentAgents(coreAgents);
      }
    } catch (err) {
      // swallow reload error, preserve previous list
      // optional: setError if needed
    }
  };

  // Core 서비스들에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        if (ServiceContainer.has('agent')) {
          const agentService = ServiceContainer.getOrThrow('agent');
          const coreAgents = await agentService.getAllAgentMetadatas();
          setCurrentAgents(coreAgents);
        } else {
          setCurrentAgents([]);
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setCurrentAgents([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleUpdateAgentStatus = async (
    agentId: string,
    newStatus: ReadonlyAgentMetadata['status']
  ): Promise<void> => {
    if (ServiceContainer.has('agent')) {
      const agentService = ServiceContainer.getOrThrow('agent');
      await agentService.updateAgent(agentId, { status: newStatus });
      await reloadAgents();
      return;
    }
    // Fallback: local state update only
    setCurrentAgents((prev) =>
      prev.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent))
    );
  };

  const handleCreateMCPTool = async (mcpConfig: McpConfig): Promise<unknown> => {
    if (ServiceContainer.has('mcp')) {
      const mcpService = ServiceContainer.getOrThrow('mcp');
      await mcpService.connectMcp(mcpConfig);
      return mcpConfig;
    }
    throw new Error('MCP service not available');
  };

  const handleCreateAgent = async (
    newAgentData: CreateAgentMetadata
  ): Promise<ReadonlyAgentMetadata> => {
    const agentService = ServiceContainer.getOrThrow('agent');
    const agent = await agentService.createAgent({
      name: newAgentData.name,
      description: newAgentData.description,
      preset: newAgentData.preset,
      status: newAgentData.status,
      icon: newAgentData.icon,
      keywords: newAgentData.keywords,
    });
    await reloadAgents();
    return agent;
  };

  const handleCreateCustomTool = async (toolData: unknown): Promise<unknown> => {
    // TODO: CustomTool 서비스 연동 시 구현
    return toolData;
  };

  // Preset 로직은 React Query 훅(use-presets)으로 이동

  const getMentionableAgents = (): ReadonlyAgentMetadata[] =>
    currentAgents.filter((agent) => agent.status === 'active' || agent.status === 'idle');

  const getActiveAgents = (): ReadonlyAgentMetadata[] =>
    currentAgents.filter((agent) => agent.status === 'active');

  // 실제 에이전트가 없는 경우의 상태 관리
  const agentsToShow = showEmptyState ? [] : currentAgents;

  return {
    currentAgents: agentsToShow,
    showEmptyState,
    setShowEmptyState,
    loading, // 로딩 상태 추가
    error, // 에러 상태 추가
    handleUpdateAgentStatus,
    handleCreateMCPTool,
    handleCreateAgent,
    handleCreateCustomTool,
    getMentionableAgents,
    getActiveAgents,
    reloadAgents, // Agent 생성 후 수동 동기화용
  };
}
// end
