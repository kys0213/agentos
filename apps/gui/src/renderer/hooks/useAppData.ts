import { useState, useEffect } from 'react';
import type { UseAppDataReturn } from '../stores/store-types';
import type { McpConfig, ReadonlyAgentMetadata } from '@agentos/core';
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
      console.log('🔄 Reloading agents from AgentService...');

      if (ServiceContainer.has('agent')) {
        const agentService = ServiceContainer.getOrThrow('agent');
        const coreAgents = await agentService.getAllAgentMetadatas();
        console.log('✅ Agents reloaded:', coreAgents);
        setCurrentAgents(coreAgents);
      }
    } catch (error) {
      console.error('❌ Failed to reload agents:', error);
    }
  };

  // Core 서비스들에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // Agent Service를 통해 실제 에이전트 로드
        console.log('🔄 Loading agents from AgentService...');

        if (ServiceContainer.has('agent')) {
          const agentService = ServiceContainer.getOrThrow('agent');
          console.log('📦 AgentService found, calling getAllAgentMetadatas()...');

          const coreAgents = await agentService.getAllAgentMetadatas();
          console.log('✅ Agents loaded from service:', coreAgents);

          setCurrentAgents(coreAgents);
        } else {
          console.warn('⚠️ AgentService not found in ServiceContainer');
          setCurrentAgents([]);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to load app data:', error);
        setError(error);
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
    try {
      // TODO: Agent 서비스 구현 후 실제 업데이트
      // if (ServiceContainer.has('agent')) {
      //   const agentService = ServiceContainer.get<AgentService>('agent');
      //   await agentService.updateStatus(agentId, newStatus);
      // }

      // 로컬 상태 업데이트
      setCurrentAgents((prev) =>
        prev.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent))
      );
    } catch (error) {
      console.error('Failed to update agent status:', error);
      throw error;
    }
  };

  const handleCreateMCPTool = async (mcpConfig: McpConfig): Promise<unknown> => {
    try {
      if (ServiceContainer.has('mcp')) {
        const mcpService = ServiceContainer.getOrThrow('mcp');
        await mcpService.connectMcp(mcpConfig);
        return mcpConfig;
      }

      throw new Error('MCP service not available');
    } catch (error) {
      console.error('Failed to create MCP tool:', error);
      throw error;
    }
  };

  const handleCreateAgent = async (
    newAgentData: Partial<ReadonlyAgentMetadata>
  ): Promise<ReadonlyAgentMetadata> => {
    try {
      if (!newAgentData.preset) {
        throw new Error('Preset is required');
      }

      const agentService = ServiceContainer.getOrThrow('agent');

      const agent = await agentService.createAgent({
        name: newAgentData.name || '',
        description: newAgentData.description || '',
        preset: newAgentData.preset,
        status: newAgentData.status || 'active',
        icon: newAgentData.icon || '',
        keywords: newAgentData.keywords || [],
      });

      // 생성 후 전체 Agent 데이터 재로드로 일관성 보장
      setTimeout(() => reloadAgents(), 100);

      return agent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  };

  const handleCreateCustomTool = async (toolData: unknown): Promise<unknown> => {
    try {
      // TODO: CustomTool 서비스 구현 후 실제 생성
      // if (ServiceContainer.has('customTool')) {
      //   const customToolService = ServiceContainer.get<CustomToolService>('customTool');
      //   return await customToolService.create(toolData);
      // }

      console.warn('Custom tool service not implemented yet:', toolData);
      return toolData;
    } catch (error) {
      console.error('Failed to create custom tool:', error);
      throw error;
    }
  };

  // Preset 로직은 React Query 훅(use-presets)으로 이동

  const getMentionableAgents = (): ReadonlyAgentMetadata[] => {
    return currentAgents.filter((agent) => agent.status === 'active' || agent.status === 'idle');
  };

  const getActiveAgents = (): ReadonlyAgentMetadata[] => {
    return currentAgents.filter((agent) => agent.status === 'active');
  };

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
