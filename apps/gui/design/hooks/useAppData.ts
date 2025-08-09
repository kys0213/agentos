import { useState, useEffect } from 'react';
import { Preset, AgentMetadata } from '../types';
// Mock 데이터 의존성 제거
// import { mockPresets, mockAgents } from '../data/mockData';
import { McpConfig } from '../components/MCPToolAdd';

// ServiceContainer와 서비스들 import (renderer와 동일한 패턴)
import { ServiceContainer } from '../../src/renderer/services/ServiceContainer';
import type { PresetService, McpService, AgentService } from '../../src/renderer/types/core-types';
import type { UseAppDataReturn } from '../../src/renderer/types/design-types';

/**
 * Design 폴더용 useAppData - ServiceContainer 기반으로 재작성
 * Mock 데이터 의존성 제거하고 Core 서비스와 연동
 * renderer/hooks/useAppData.ts와 동일한 패턴 및 타입 적용
 */
export function useAppData(): UseAppDataReturn {
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

        // AgentService를 통해 Agent 데이터 로드
        if (ServiceContainer.has('agent')) {
          const agentService = ServiceContainer.get<AgentService>('agent');
          const coreAgents = await agentService.getAll();
          setAgents(coreAgents);
        } else {
          // Agent 서비스가 없는 경우 빈 배열
          setAgents([]);
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to load app data:', errorObj);
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

  const handleUpdateAgentStatus = (agentId: string, newStatus: AgentMetadata['status']) => {
    setAgents((prev: AgentMetadata[]) =>
      prev.map((agent: AgentMetadata) => (agent.id === agentId ? { ...agent, status: newStatus } : agent))
    );
  };

  const handleCreatePreset = (newPresetData: Partial<Preset>): Preset => {
    // 임시로 클라이언트 상태로만 생성 (실제로는 async로 Core 서비스와 연동)
    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name: newPresetData.name || '',
      description: newPresetData.description || '',
      author: 'User',
      version: '1.0.0',
      systemPrompt: newPresetData.systemPrompt || '',
      enabledMcps: [],
      llmBridgeName: 'default',
      llmBridgeConfig: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      category: newPresetData.category || ['general'],
      status: newPresetData.status || 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: {
        indexed: 0,
        vectorized: 0,
        totalSize: 0,
      },
    };

    setPresets((prev) => [...prev, preset]);
    return preset;
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

  const handleCreateAgent = (newAgentData: Partial<AgentMetadata>): AgentMetadata => {
    if (!newAgentData.preset) {
      throw new Error('Preset is required');
    }

    // AgentService를 통해 Agent 생성
    const agent: AgentMetadata = {
      id: `agent-${Date.now()}`,
      name: newAgentData.name || '',
      description: newAgentData.description || '',
      status: newAgentData.status || 'active',
      preset: newAgentData.preset,
      keywords: newAgentData.keywords || [],
      icon: newAgentData.icon || '',
      lastUsed: undefined,
      sessionCount: 0,
      usageCount: 0,
    };

    // 실제 Core 서비스에 생성 요청
    if (ServiceContainer.has('agent')) {
      const agentService = ServiceContainer.get<AgentService>('agent');
      // TODO: 실제 구현에서는 await agentService.create(agent)를 사용
      // 현재는 IPC 채널 구현이 필요하므로 클라이언트 상태로만 관리
    }

    setAgents((prev: AgentMetadata[]) => [...prev, agent]);
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

  // renderer 패턴과 동일하게 agentsToShow 로직 적용
  const agentsToShow = showEmptyState ? [] : currentAgents;

  return {
    presets,
    currentAgents: agentsToShow, // showEmptyState 로직 적용
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
