import { useState, useEffect } from 'react';
import type { UseAppDataReturn } from '../types/design-types';
import { PresetService, McpService } from '../types/core-types';
import { Preset, McpConfig, Agent, ReadonlyAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { ServiceContainer } from '../services/ServiceContainer';

/**
 * App data management hook
 * ServiceContainer를 통해 Core 서비스와 연동하도록 재작성된 버전
 * Mock 데이터 대신 실제 Core 서비스를 사용
 */
export function useAppData(): UseAppDataReturn {
  const [presets, setPresets] = useState<ReadonlyPreset[]>([]);
  const [currentAgents, setCurrentAgents] = useState<ReadonlyAgentMetadata[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Core 서비스들에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // Preset Service를 통해 프리셋 로드
        console.log('🔄 Loading presets from PresetService...');
        
        if (ServiceContainer.has('preset')) {
          const presetService = ServiceContainer.get<PresetService>('preset');
          console.log('📦 PresetService found, calling getAll()...');
          
          const corePresets = await presetService.getAll();
          console.log('✅ Presets loaded from service:', corePresets);

          // Core Preset을 DesignPreset으로 변환
          const designPresets: Preset[] = corePresets.map(
            (preset: Preset): Preset => ({
              ...preset,
              usageCount: 0, // UI 전용 필드들 기본값 설정
              knowledgeDocuments: 0,
              knowledgeStats: {
                indexed: 0,
                vectorized: 0,
                totalSize: 0,
              },
              // 새 디자인 필드들 기본값
              category: preset.category || ['general'],
              status: preset.status || 'active',
            })
          );

          console.log('🎨 Presets converted for UI:', designPresets);
          setPresets(designPresets);
        } else {
          console.warn('⚠️ PresetService not found in ServiceContainer');
        }

        // TODO: Agent 데이터는 현재 Core에 없으므로 임시로 빈 배열
        // 실제로는 AgentManager나 별도 서비스에서 로드해야 함
        setCurrentAgents([]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to load app data:', error);
        setError(error);
        // 에러 발생 시 빈 상태로 설정
        setPresets([]);
        setCurrentAgents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateAgentStatus = async (
    agentId: string,
    newStatus: Agent['status']
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

  const handleCreatePreset = async (
    newPresetData: Partial<ReadonlyPreset>
  ): Promise<ReadonlyPreset> => {
    try {
      console.log('🔄 Creating new preset:', newPresetData);
      
      if (ServiceContainer.has('preset')) {
        const presetService = ServiceContainer.get<PresetService>('preset');

        const presetToCreate: Preset = {
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

        console.log('📤 Sending preset to service:', presetToCreate);
        const result = await presetService.create(presetToCreate);
        console.log('📥 Service create result:', result);
        
        if (result.success) {
          setPresets((prev) => [...prev, presetToCreate]);
          console.log('✅ Preset created and added to state');
          return presetToCreate;
        }
        throw new Error('Failed to create preset - service returned failure');
      }

      throw new Error('PresetService not available');
    } catch (error) {
      console.error('❌ Failed to create preset:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleCreateMCPTool = async (mcpConfig: McpConfig): Promise<unknown> => {
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

  const handleCreateAgent = async (
    newAgentData: Partial<ReadonlyAgentMetadata>
  ): Promise<ReadonlyAgentMetadata> => {
    try {
      if (!newAgentData.preset) {
        throw new Error('Preset is required');
      }

      // TODO: Agent 서비스 구현 후 실제 생성
      // if (ServiceContainer.has('agent')) {
      //   const agentService = ServiceContainer.get<AgentService>('agent');
      //   const result = await agentService.create(agentToCreate);
      //   if (result.success) {
      //     setCurrentAgents((prev) => [...prev, agentToCreate]);
      //     return agentToCreate;
      //   }
      //   throw new Error('Failed to create agent');
      // }

      // 임시로 클라이언트 상태로만 생성
      const agent: ReadonlyAgentMetadata = {
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

      setCurrentAgents((prev) => [...prev, agent]);
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

  const handleUpdatePreset = async (updatedPreset: Preset): Promise<void> => {
    try {
      console.log('🔄 Updating preset:', updatedPreset);
      
      if (ServiceContainer.has('preset')) {
        const presetService = ServiceContainer.get<PresetService>('preset');

        // DesignPreset을 Core Preset으로 변환하여 업데이트
        const corePreset: Preset = {
          ...updatedPreset,
          updatedAt: new Date(),
        };

        console.log('📤 Sending preset update to service:', corePreset);
        const result = await presetService.update(corePreset);
        console.log('📥 Service update result:', result);

        if (!result.success) {
          throw new Error('Failed to update preset - service returned failure');
        }
      }

      // 로컬 상태 업데이트
      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === updatedPreset.id ? { ...updatedPreset, updatedAt: new Date() } : preset
        )
      );
      console.log('✅ Preset updated in state');
    } catch (error) {
      console.error('❌ Failed to update preset:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleDeletePreset = async (presetId: string): Promise<void> => {
    try {
      console.log('🔄 Deleting preset:', presetId);
      
      if (ServiceContainer.has('preset')) {
        const presetService = ServiceContainer.get<PresetService>('preset');
        
        console.log('📤 Sending delete request to service for:', presetId);
        const result = await presetService.delete(presetId);
        console.log('📥 Service delete result:', result);

        if (!result.success) {
          throw new Error('Failed to delete preset - service returned failure');
        }
      }

      // 로컬 상태에서 제거
      setPresets((prev) => prev.filter((preset) => preset.id !== presetId));
      console.log('✅ Preset deleted from state');
    } catch (error) {
      console.error('❌ Failed to delete preset:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const getMentionableAgents = (): ReadonlyAgentMetadata[] => {
    return currentAgents.filter((agent) => agent.status === 'active' || agent.status === 'idle');
  };

  const getActiveAgents = (): ReadonlyAgentMetadata[] => {
    return currentAgents.filter((agent) => agent.status === 'active');
  };

  // 실제 에이전트가 없는 경우의 상태 관리
  const agentsToShow = showEmptyState ? [] : currentAgents;

  return {
    presets,
    currentAgents: agentsToShow,
    showEmptyState,
    setShowEmptyState,
    loading, // 로딩 상태 추가
    error, // 에러 상태 추가
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
