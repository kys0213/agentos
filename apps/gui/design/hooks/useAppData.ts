import { useState, useEffect } from 'react';
import { Preset, AgentMetadata } from '../types';
// Mock 데이터 의존성 제거
// import { mockPresets, mockAgents } from '../data/mockData';
import { McpConfig } from '../components/MCPToolAdd';

// ServiceContainer와 서비스들 import (renderer와 동일한 패턴)
import { ServiceContainer } from '../../src/renderer/services/ServiceContainer';
import type { PresetService, McpService } from '../../src/renderer/types/core-types';

/**
 * Design 폴더용 useAppData - ServiceContainer 기반으로 재작성
 * Mock 데이터 의존성 제거하고 Core 서비스와 연동
 */
export function useAppData() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core 서비스들에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Preset Service를 통해 프리셋 로드
        if (ServiceContainer.has('preset')) {
          const presetService = ServiceContainer.get<PresetService>('preset');
          const corePresets = await presetService.getAll();
          setPresets(corePresets);
        }

        // TODO: Agent 데이터는 현재 Core에 없으므로 임시로 빈 배열
        // 실제로는 AgentManager나 별도 서비스에서 로드해야 함
        setAgents([]);
      } catch (error) {
        console.error('Failed to load app data:', error);
        // 에러 발생 시 빈 상태로 설정
        setPresets([]);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const currentAgents = showEmptyState ? [] : agents;

  const handleUpdateAgentStatus = (agentId: string, newStatus: 'active' | 'idle' | 'inactive') => {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent))
    );
  };

  const handleCreatePreset = async (
    newPreset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'knowledgeDocuments' | 'knowledgeStats'>
  ): Promise<Preset> => {
    try {
      const preset: Preset = {
        ...newPreset,
        id: `preset-${Date.now()}`,
        author: 'User',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        knowledgeDocuments: 0,
        knowledgeStats: {
          indexed: 0,
          vectorized: 0,
          totalSize: 0,
        },
      };

      // ServiceContainer를 통해 Core 서비스에 생성 요청
      if (ServiceContainer.has('preset')) {
        const presetService = ServiceContainer.get<PresetService>('preset');
        await presetService.create(preset);
      }

      setPresets((prev) => [...prev, preset]);
      return preset;
    } catch (error) {
      console.error('Failed to create preset:', error);
      throw error;
    }
  };

  const handleCreateMCPTool = async (mcpConfig: McpConfig): Promise<McpConfig> => {
    try {
      if (ServiceContainer.has('mcp')) {
        const mcpService = ServiceContainer.get<McpService>('mcp');
        await mcpService.connect(mcpConfig);
        return mcpConfig;
      }
      
      throw new Error('MCP service not available');
    } catch (error) {
      console.error('Failed to create MCP tool:', error);
      throw error;
    }
  };

  const handleCreateAgent = (newAgent: Omit<AgentMetadata, 'id' | 'usageCount' | 'lastUsed' | 'sessionCount'>) => {
    const agent: AgentMetadata = {
      ...newAgent,
      id: `agent-${Date.now()}`,
      usageCount: 0,
      lastUsed: undefined,
      sessionCount: 0,
    };

    setAgents((prev) => [...prev, agent]);
    return agent;
  };

  const handleCreateCustomTool = (toolData: unknown) => {
    // TODO: Custom Tool 생성 로직 구현
    console.log('Created custom tool:', toolData);
    return toolData;
  };

  const handleUpdatePreset = async (updatedPreset: Preset): Promise<void> => {
    try {
      if (ServiceContainer.has('preset')) {
        const presetService = ServiceContainer.get<PresetService>('preset');
        const presetToUpdate = { ...updatedPreset, updatedAt: new Date() };
        await presetService.update(presetToUpdate);
      }

      // 로컬 상태 업데이트
      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === updatedPreset.id ? { ...updatedPreset, updatedAt: new Date() } : preset
        )
      );
    } catch (error) {
      console.error('Failed to update preset:', error);
      throw error;
    }
  };

  const handleDeletePreset = async (presetId: string): Promise<void> => {
    try {
      if (ServiceContainer.has('preset')) {
        const presetService = ServiceContainer.get<PresetService>('preset');
        await presetService.delete(presetId);
      }

      // 로컬 상태에서 제거
      setPresets((prev) => prev.filter((preset) => preset.id !== presetId));
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw error;
    }
  };

  const getMentionableAgents = () => {
    return currentAgents.filter((agent) => agent.status === 'active' || agent.status === 'idle');
  };

  const getActiveAgents = () => {
    return currentAgents.filter((agent) => agent.status === 'active');
  };

  return {
    presets,
    agents,
    currentAgents,
    showEmptyState,
    setShowEmptyState,
    loading, // 로딩 상태 추가
    handleUpdateAgentStatus,
    handleCreatePreset,
    handleCreateMCPTool,
    handleCreateAgent,
    handleCreateCustomTool,
    handleUpdatePreset,
    handleDeletePreset,
    getMentionableAgents,
    getActiveAgents,
  };
}
