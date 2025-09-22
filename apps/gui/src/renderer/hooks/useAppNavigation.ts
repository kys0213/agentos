import { useState } from 'react';
import type { AppSection, UseAppNavigationReturn } from '../stores/store-types';

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

  const resetCreateStates = () => {
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  };

  const handleBackToChat = () => {
    setActiveSection('chat');
    resetCreateStates();
  };

  const handleBackToTools = () => {
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  };

  const handleBackToAgents = () => {
    setCreatingAgent(false);
    setCreatingMCPTool(false);
    setCreatingCustomTool(false);
  };

  const handleBackToToolBuilder = () => {
    setCreatingCustomTool(false);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
  };

  const handleStartCreateAgent = () => {
    setCreatingAgent(true);
    setCreatingMCPTool(false);
    setCreatingCustomTool(false);
  };

  const handleStartCreateCustomTool = () => {
    setCreatingCustomTool(true);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
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

    // Actions
    setActiveSection,
    handleBackToChat,
    handleBackToTools,
    handleBackToAgents,
    handleBackToToolBuilder,
    handleStartCreateAgent,
    handleStartCreateCustomTool,
    isInDetailView,
  };
}
