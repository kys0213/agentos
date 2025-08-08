import { useState, useEffect } from 'react';
import type {
  DesignPreset,
  DesignAgent,
  UseAppDataReturn,
  CoreMcpConfig,
} from '../types/design-types';
import type { Preset, PresetService, McpService } from '../types/core-types';
import { ServiceContainer } from '../services/ServiceContainer';

/**
 * App data management hook
 * ServiceContainer를 통해 Core 서비스와 연동하도록 재작성된 버전
 * Mock 데이터 대신 실제 Core 서비스를 사용
 */
export function useAppData(): UseAppDataReturn {
  const [presets, setPresets] = useState<DesignPreset[]>([]);
  const [currentAgents, setCurrentAgents] = useState<DesignAgent[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core 서비스들에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // Preset Service를 통해 프리셋 로드
        if (ServiceContainer.has('preset')) {
          const presetService = ServiceContainer.get<PresetService>('preset');
          const corePresets = await presetService.getAll();
          
          // Core Preset을 DesignPreset으로 변환
          const designPresets: DesignPreset[] = corePresets.map((preset: Preset) => ({
            ...preset,
            usageCount: 0, // UI 전용 필드들 기본값 설정
            knowledgeDocuments: 0,
            knowledgeStats: {
              indexed: 0,
              vectorized: 0,
              totalSize: 0,
            },
            // 새 디자인 필드들 기본값
            category: 'general',
            model: 'gpt-3.5-turbo',
            parameters: {
              temperature: 0.7,
              maxTokens: 1000,
              topP: 1.0,
            },
            tools: [],
            status: 'active' as const,
          }));
          
          setPresets(designPresets);
        }

        // TODO: Agent 데이터는 현재 Core에 없으므로 임시로 빈 배열
        // 실제로는 AgentManager나 별도 서비스에서 로드해야 함
        setCurrentAgents([]);
        
      } catch (error) {
        console.error('Failed to load app data:', error);
        // 에러 발생 시 빈 상태로 설정
        setPresets([]);
        setCurrentAgents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateAgentStatus = (
    agentId: string, 
    newStatus: DesignAgent['status']
  ) => {
    setCurrentAgents(prev => 
      prev.map(agent => 
        agent.id === agentId ? { ...agent, status: newStatus } : agent
      )
    );
  };

  const handleCreatePreset = (
    newPresetData: Partial<DesignPreset>
  ): DesignPreset => {
    // 임시로 클라이언트 상태로만 생성 (실제로는 async로 Core 서비스와 연동)
    const designPreset: DesignPreset = {
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
      // 새 디자인 필드들
      category: newPresetData.category || 'general',
      model: newPresetData.model || 'gpt-3.5-turbo',
      parameters: newPresetData.parameters || {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1.0,
      },
      tools: newPresetData.tools || [],
      status: newPresetData.status || 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: {
        indexed: 0,
        vectorized: 0,
        totalSize: 0,
      },
    };

    setPresets(prev => [...prev, designPreset]);
    return designPreset;
  };

  const handleCreateMCPTool = async (mcpConfig: CoreMcpConfig): Promise<unknown> => {
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

  const handleCreateAgent = (
    newAgentData: Partial<DesignAgent>
  ): DesignAgent => {
    // TODO: Agent는 현재 Core에 없으므로 클라이언트 상태로만 관리
    const agent: DesignAgent = {
      id: `agent-${Date.now()}`,
      name: newAgentData.name || '',
      description: newAgentData.description || '',
      category: newAgentData.category || 'general',
      status: newAgentData.status || 'active',
      preset: newAgentData.preset || '',
      usageCount: 0,
      avatar: newAgentData.avatar,
      tags: newAgentData.tags || [],
      lastUsed: undefined,
    };
    
    setCurrentAgents(prev => [...prev, agent]);
    return agent;
  };

  const handleCreateCustomTool = (toolData: unknown) => {
    // TODO: Custom Tool 생성 로직 구현
    console.log('Created custom tool:', toolData);
    return toolData;
  };

  const handleUpdatePreset = async (updatedPreset: DesignPreset): Promise<void> => {
    try {
      if (ServiceContainer.has('preset')) {
        const presetService = ServiceContainer.get<PresetService>('preset');
        
        // DesignPreset을 Core Preset으로 변환하여 업데이트
        const corePreset: Preset = {
          ...updatedPreset,
          updatedAt: new Date(),
        };
        
        await presetService.update(corePreset);
      }

      // 로컬 상태 업데이트
      setPresets(prev => 
        prev.map(preset => 
          preset.id === updatedPreset.id 
            ? { ...updatedPreset, updatedAt: new Date() }
            : preset
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
      setPresets(prev => prev.filter(preset => preset.id !== presetId));
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw error;
    }
  };

  const getMentionableAgents = (): DesignAgent[] => {
    return currentAgents.filter(
      agent => agent.status === 'active' || agent.status === 'idle'
    );
  };

  const getActiveAgents = (): DesignAgent[] => {
    return currentAgents.filter(agent => agent.status === 'active');
  };

  // 실제 에이전트가 없는 경우의 상태 관리
  const agentsToShow = showEmptyState ? [] : currentAgents;

  return {
    presets,
    currentAgents: agentsToShow,
    showEmptyState,
    setShowEmptyState,
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