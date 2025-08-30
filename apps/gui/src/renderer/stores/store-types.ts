import type {
  AgentMetadata,
  AgentStatus,
  CreateAgentMetadata,
  McpConfig,
  Preset,
  ReadonlyAgentMetadata,
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
  currentAgents: ReadonlyAgentMetadata[];
  showEmptyState: boolean;
  setShowEmptyState: (show: boolean) => void;
  loading: boolean; // 로딩 상태
  error: Error | null; // 에러 상태 추가
  handleUpdateAgentStatus: (agentId: string, status: AgentStatus) => Promise<void>;
  handleCreateMCPTool: (mcpConfig: McpConfig) => Promise<unknown>;
  handleCreateAgent: (agent: CreateAgentMetadata) => Promise<AgentMetadata>;
  handleCreateCustomTool: (toolData: unknown) => Promise<unknown>;
  getMentionableAgents: () => ReadonlyAgentMetadata[];
  getActiveAgents: () => ReadonlyAgentMetadata[];
  reloadAgents: () => Promise<void>; // Agent 생성 후 수동 동기화용
}
