import { useState, useEffect } from 'react';
import type { UseAppDataReturn } from '../stores/store-types';
import type { Preset, McpConfig, ReadonlyAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { ServiceContainer } from '../../shared/di/service-container';

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

  // 데이터를 다시 로드하는 함수 (Agent 생성 후 동기화용)
  const reloadAgents = async () => {
    try {
      console.log('🔄 Reloading agents from AgentService...');

      if (ServiceContainer.has('agent')) {
        const agentService = ServiceContainer.getOrThrow('agent');
        const coreAgents = (await agentService.getAllAgentMetadatas()) as any;
        console.log('✅ Agents reloaded:', coreAgents);
        setCurrentAgents(coreAgents as any);
      }
    } catch (error) {
      console.error('❌ Failed to reload agents:', error);
    }
  };

  // Core 서비스들에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // Preset Service를 통해 프리셋 로드
        console.log('🔄 Loading presets from PresetService...');

        if (ServiceContainer.has('preset')) {
          const presetService = ServiceContainer.getOrThrow('preset');
          console.log('📦 PresetService found, calling getAllPresets()...');

          const corePresets = await presetService.getAllPresets();
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

        // Agent Service를 통해 실제 에이전트 로드
        console.log('🔄 Loading agents from AgentService...');

        if (ServiceContainer.has('agent')) {
          const agentService = ServiceContainer.getOrThrow('agent');
          console.log('📦 AgentService found, calling getAllAgentMetadatas()...');

          const coreAgents = (await agentService.getAllAgentMetadatas()) as any;
          console.log('✅ Agents loaded from service:', coreAgents);

          setCurrentAgents(coreAgents as any);
        } else {
          console.warn('⚠️ AgentService not found in ServiceContainer');
          setCurrentAgents([]);
        }
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
        ((prev as any).map((agent: any) =>
          agent.id === agentId ? { ...agent, status: newStatus } : agent
        ) as any)
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
        const presetService = ServiceContainer.getOrThrow('preset');

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
        const result = await presetService.createPreset(presetToCreate);
        console.log('📥 Service create result:', result);

        setPresets((prev) => [...prev, result]);
        console.log('✅ Preset created and added to state');
        return result;
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

      // 즉시 로컬 상태 업데이트 + 전체 데이터 재로드로 이중 보장
      setCurrentAgents((prev) => ([...(prev as any), agent as any] as any));

      // 추가 안전장치: 전체 Agent 데이터 재로드
      setTimeout(() => reloadAgents(), 100);

      return agent as any;
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
        const presetService = ServiceContainer.getOrThrow('preset');

        // DesignPreset을 Core Preset으로 변환하여 업데이트
        const corePreset: Preset = {
          ...updatedPreset,
          updatedAt: new Date(),
        };

        console.log('📤 Sending preset update to service:', corePreset);
        const result = await presetService.updatePreset(corePreset.id, corePreset);
        console.log('📥 Service update result:', result);
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
        const presetService = ServiceContainer.getOrThrow('preset');

        console.log('📤 Sending delete request to service for:', presetId);
        const result = await presetService.deletePreset(presetId);
        console.log('📥 Service delete result:', result);
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
    reloadAgents, // Agent 생성 후 수동 동기화용
  };
}
/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */
