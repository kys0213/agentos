import { useState } from 'react';
import type {
  AgentCreationStep,
  AppSection,
  CustomToolCreationStep,
  McpCreationStep,
  UseAppNavigationReturn,
} from '../stores/store-types';

/**
 * App navigation state management hook
 * ServiceContainer 기반으로 재작성된 버전
 * 새 디자인의 네비게이션 로직을 Core 타입과 호환되도록 구현
 */
export function useAppNavigation(): UseAppNavigationReturn {
  const [activeSection, setActiveSection] = useState<AppSection>('chat');
  const [creatingMCPTool, setCreatingMCPTool] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingCustomTool, setCreatingCustomTool] = useState(false);
  const [agentCreationStep, setAgentCreationStep] = useState<AgentCreationStep>('overview');
  const [mcpCreationStep, setMcpCreationStep] = useState<McpCreationStep>('overview');
  const [customToolCreationStep, setCustomToolCreationStep] =
    useState<CustomToolCreationStep>('describe');

  const resetCreateStates = () => {
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
    setAgentCreationStep('overview');
    setMcpCreationStep('overview');
    setCustomToolCreationStep('describe');
  };

  const handleBackToChat = () => {
    setActiveSection('chat');
    resetCreateStates();
  };

  const handleBackToTools = () => {
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
    setMcpCreationStep('overview');
  };

  const handleBackToAgents = () => {
    setCreatingAgent(false);
    setCreatingMCPTool(false);
    setCreatingCustomTool(false);
    setAgentCreationStep('overview');
  };

  const handleBackToToolBuilder = () => {
    setCreatingCustomTool(false);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCustomToolCreationStep('describe');
  };

  const handleStartCreateMCPTool = (step: McpCreationStep = 'overview') => {
    setCreatingMCPTool(true);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
    setMcpCreationStep(step);
  };

  const handleStartCreateAgent = (step: AgentCreationStep = 'overview') => {
    setCreatingAgent(true);
    setCreatingMCPTool(false);
    setCreatingCustomTool(false);
    setAgentCreationStep(step);
  };

  const handleStartCreateCustomTool = () => {
    setCreatingCustomTool(true);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCustomToolCreationStep('describe');
  };

  const isInDetailView = () => {
    return creatingMCPTool || creatingAgent || creatingCustomTool;
  };

  return {
    // State
    activeSection,
    creatingMCPTool,
    creatingAgent,
    creatingCustomTool,
    agentCreationStep,
    mcpCreationStep,
    customToolCreationStep,

    // Actions
    setActiveSection,
    handleBackToChat,
    handleBackToTools,
    handleBackToAgents,
    handleBackToToolBuilder,
    handleStartCreateMCPTool,
    handleStartCreateAgent,
    handleStartCreateCustomTool,
    setAgentCreationStep,
    setMcpCreationStep,
    setCustomToolCreationStep,
    isInDetailView,
  };
}
