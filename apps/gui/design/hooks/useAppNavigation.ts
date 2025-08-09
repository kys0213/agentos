import { useState, useCallback } from 'react';
import type { Preset, AppSection } from '../types';
import type { UseAppNavigationReturn } from '../../src/renderer/types/design-types';

/**
 * Navigation 상태 관리 Hook - 순수 UI 상태만 관리
 * 비즈니스 로직은 제거하고 네비게이션 UI 상태만 집중 관리
 * Core 타입과 완전 호환되도록 개선
 */
export function useAppNavigation(): UseAppNavigationReturn {
  const [activeSection, setActiveSection] = useState<AppSection>('chat');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [creatingPreset, setCreatingPreset] = useState(false);
  const [creatingMCPTool, setCreatingMCPTool] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingCustomTool, setCreatingCustomTool] = useState(false);

  // 모든 생성 상태를 초기화하는 헬퍼 함수 (메모이제이션)
  const resetCreateStates = useCallback(() => {
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  }, []);

  // 채팅으로 돌아가는 네비게이션 (메모이제이션)
  const handleBackToChat = useCallback(() => {
    setActiveSection('chat');
    setSelectedPreset(null);
    resetCreateStates();
  }, [resetCreateStates]);

  // Preset 선택 핸들러 (메모이제이션)
  const handleSelectPreset = useCallback((preset: Preset) => {
    setSelectedPreset(preset);
    resetCreateStates();
  }, [resetCreateStates]);

  // 각 섹션별 뒤로 가기 핸들러들 (메모이제이션 및 통합)
  const handleBackToPresets = useCallback(() => {
    setSelectedPreset(null);
    resetCreateStates();
  }, [resetCreateStates]);

  const handleBackToTools = useCallback(() => {
    setSelectedPreset(null);
    resetCreateStates();
  }, [resetCreateStates]);

  const handleBackToAgents = useCallback(() => {
    setSelectedPreset(null);
    resetCreateStates();
  }, [resetCreateStates]);

  const handleBackToToolBuilder = useCallback(() => {
    setSelectedPreset(null);
    resetCreateStates();
  }, [resetCreateStates]);

  // 각 생성 모드 시작 핸들러들 (메모이제이션 및 로직 통합)
  const handleStartCreatePreset = useCallback(() => {
    setSelectedPreset(null);
    setCreatingPreset(true);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  }, []);

  const handleStartCreateMCPTool = useCallback(() => {
    setSelectedPreset(null);
    setCreatingPreset(false);
    setCreatingMCPTool(true);
    setCreatingAgent(false);
    setCreatingCustomTool(false);
  }, []);

  const handleStartCreateAgent = useCallback(() => {
    setSelectedPreset(null);
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setCreatingAgent(true);
    setCreatingCustomTool(false);
  }, []);

  const handleStartCreateCustomTool = useCallback(() => {
    setSelectedPreset(null);
    setCreatingPreset(false);
    setCreatingMCPTool(false);
    setCreatingAgent(false);
    setCreatingCustomTool(true);
  }, []);

  // 디테일 뷰 상태 체크 유틸리티 (메모이제이션)
  const isInDetailView = useCallback(() => {
    return (
      selectedPreset !== null || creatingPreset || creatingMCPTool || creatingAgent || creatingCustomTool
    );
  }, [selectedPreset, creatingPreset, creatingMCPTool, creatingAgent, creatingCustomTool]);

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
