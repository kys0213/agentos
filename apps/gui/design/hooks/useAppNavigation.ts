import { useState } from 'react';
import { Preset, Agent, ChatAgent, AppSection } from '../types';
import { McpConfig } from '../components/MCPToolAdd';

export function useAppNavigation() {
  const [activeSection, setActiveSection] = useState<AppSection>('chat');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [creatingPreset, setCreatingPreset] = useState(false);
  const [creatingMCPTool, setCreatingMCPTool] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingCustomTool, setCreatingCustomTool] = useState(false);

  const resetCreateStates = () => {
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  };

  const handleBackToChat = () => {
    setActiveSection('chat');
    setSelectedPreset(null);
    resetCreateStates();
  };

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    resetCreateStates();
  };

  const handleBackToPresets = () => {
    setSelectedPreset(null);
    resetCreateStates();
  };

  const handleBackToTools = () => {
    setCreatingMCPTool(false);
    setCreatingPreset(false);
    setSelectedPreset(null);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  };

  const handleBackToAgents = () => {
    setCreatingAgent(false);
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setSelectedPreset(null);
    setCreatingCustomTool(false);
  };

  const handleBackToToolBuilder = () => {
    setCreatingCustomTool(false);
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setSelectedPreset(null);
  };

  const handleStartCreatePreset = () => {
    setSelectedPreset(null);
    setCreatingPreset(true);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  };

  const handleStartCreateMCPTool = () => {
    setCreatingMCPTool(true);
    setCreatingPreset(false);
    setSelectedPreset(null);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  };

  const handleStartCreateAgent = () => {
    setCreatingAgent(true);
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setSelectedPreset(null);
    setCreatingCustomTool(false);
  };

  const handleStartCreateCustomTool = () => {
    setCreatingCustomTool(true);
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setSelectedPreset(null);
  };

  const isInDetailView = () => {
    return (
      selectedPreset || creatingPreset || creatingMCPTool || creatingAgent || creatingCustomTool
    );
  };

  return {
    // State
    activeSection,
    selectedPreset,
    creatingPreset,
    creatingMCPTool,
    creatingAgent,
    creatingCustomTool,

    // Actions
    setActiveSection,
    handleBackToChat,
    handleSelectPreset,
    handleBackToPresets,
    handleBackToTools,
    handleBackToAgents,
    handleBackToToolBuilder,
    handleStartCreatePreset,
    handleStartCreateMCPTool,
    handleStartCreateAgent,
    handleStartCreateCustomTool,
    isInDetailView,
  };
}
