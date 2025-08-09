/**
 * 새 디자인 타입들을 기존 Core 타입과 매핑하는 호환성 레이어
 * Design/types를 Core 타입과 통합하여 타입 안전성 보장
 */

import type {
  Agent,
  ChatSessionMetadata,
  McpConfig,
  Preset,
  ReadonlyAgentMetadata,
  ReadonlyPreset,
} from '@agentos/core';

/**
 * 앱 섹션 타입
 */
export type AppSection =
  | 'dashboard'
  | 'chat'
  | 'subagents'
  | 'presets'
  | 'models'
  | 'tools'
  | 'toolbuilder'
  | 'racp'
  | 'settings';

export type MinimizedAgent = Pick<ReadonlyAgentMetadata, 'id' | 'name' | 'icon'>;

/**
 * 네비게이션 상태 관리를 위한 타입들
 */
export interface NavigationState {
  activeSection: AppSection;
  selectedPreset: Preset | null;
  creatingPreset: boolean;
  creatingMCPTool: boolean;
  creatingAgent: boolean;
  creatingCustomTool: boolean;
}

/**
 * 채팅 상태 관리를 위한 타입들
 */
export interface ChatState {
  activeChatAgent: ReadonlyAgentMetadata | null;
  minimizedChats: ChatSessionMetadata[];
}

/**
 * 앱 데이터 상태를 위한 타입들
 */
export interface AppDataState {
  presets: Preset[];
  currentAgents: Agent[];
  showEmptyState: boolean;
}

/**
 * useAppNavigation hook의 반환 타입
 */
export interface UseAppNavigationReturn {
  // 상태
  activeSection: AppSection;
  selectedPreset: Preset | null;
  creatingPreset: boolean;
  creatingMCPTool: boolean;
  creatingAgent: boolean;
  creatingCustomTool: boolean;

  // 액션들
  setActiveSection: (section: AppSection) => void;
  handleBackToChat: () => void;
  handleSelectPreset: (preset: Preset) => void;
  handleBackToPresets: () => void;
  handleBackToTools: () => void;
  handleBackToAgents: () => void;
  handleBackToToolBuilder: () => void;
  handleStartCreatePreset: () => void;
  handleStartCreateMCPTool: () => void;
  handleStartCreateAgent: () => void;
  handleStartCreateCustomTool: () => void;

  // 유틸리티
  isInDetailView: () => boolean;
}

/**
 * useChatState hook의 반환 타입
 */
export interface UseChatStateReturn {
  activeChatAgent: ReadonlyAgentMetadata | null;
  minimizedChats: ReadonlyAgentMetadata[];
  handleOpenChat: (agent: ReadonlyAgentMetadata) => void;
  handleCloseChat: () => void;
  handleMinimizeChat: () => void;
  handleRestoreChat: (agent: ReadonlyAgentMetadata) => void;
}

/**
 * useAppData hook의 반환 타입
 */
export interface UseAppDataReturn {
  presets: ReadonlyPreset[];
  currentAgents: ReadonlyAgentMetadata[];
  showEmptyState: boolean;
  setShowEmptyState: (show: boolean) => void;
  loading: boolean; // 로딩 상태 추가
  handleUpdateAgentStatus: (agentId: string, status: Agent['status']) => void;
  handleCreatePreset: (preset: Partial<ReadonlyPreset>) => ReadonlyPreset;
  handleCreateMCPTool: (mcpConfig: McpConfig) => Promise<unknown>;
  handleCreateAgent: (agent: Partial<ReadonlyAgentMetadata>) => ReadonlyAgentMetadata;
  handleCreateCustomTool: (toolData: unknown) => unknown;
  handleUpdatePreset: (preset: Preset) => Promise<void>;
  handleDeletePreset: (presetId: string) => Promise<void>;
  getMentionableAgents: () => ReadonlyAgentMetadata[];
  getActiveAgents: () => ReadonlyAgentMetadata[];
}
