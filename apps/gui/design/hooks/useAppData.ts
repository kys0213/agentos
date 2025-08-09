import { useState } from 'react';
import { Preset, Agent } from '../types';
import { mockPresets, mockAgents } from '../data/mockData';
import { McpConfig } from '../components/MCPToolAdd';

export function useAppData() {
  const [presets, setPresets] = useState<Preset[]>(mockPresets);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [showEmptyState, setShowEmptyState] = useState(false);

  const currentAgents = showEmptyState ? [] : agents;

  const handleUpdateAgentStatus = (agentId: string, newStatus: 'active' | 'idle' | 'inactive') => {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent))
    );
  };

  const handleCreatePreset = (
    newPreset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'knowledgeDocuments'>
  ) => {
    const preset: Preset = {
      ...newPreset,
      id: `preset-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      knowledgeDocuments: 0,
    };

    setPresets((prev) => [...prev, preset]);
    return preset;
  };

  const handleCreateMCPTool = (mcpConfig: McpConfig) => {
    console.log('Created MCP tool:', mcpConfig);
    return mcpConfig;
  };

  const handleCreateAgent = (newAgent: Omit<Agent, 'id' | 'usageCount' | 'lastUsed'>) => {
    const agent: Agent = {
      ...newAgent,
      id: `agent-${Date.now()}`,
      usageCount: 0,
      lastUsed: undefined,
    };

    setAgents((prev) => [...prev, agent]);
    return agent;
  };

  const handleCreateCustomTool = (toolData: any) => {
    console.log('Created custom tool:', toolData);
    return toolData;
  };

  const handleUpdatePreset = (updatedPreset: Preset) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === updatedPreset.id ? { ...updatedPreset, updatedAt: new Date() } : preset
      )
    );
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((preset) => preset.id !== presetId));
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
