import type {
  AgentStatus,
  CreateAgentMetadata,
  McpConfig,
  ReadonlyAgentMetadata,
} from '@agentos/core';

/**
 * 앱 섹션 타입
 */

export type AppSection =
  | 'dashboard'
  | 'chat'
  | 'subagents'
  | 'models'
  | 'tools'
  | 'toolbuilder'
  | 'racp'
  | 'settings';

export type AgentCreationStep = 'overview' | 'category' | 'ai-config' | 'settings';
export type McpCreationStep = 'overview' | 'type' | 'configuration' | 'testing' | 'deployment';
export type CustomToolCreationStep = 'describe' | 'analyze' | 'generate' | 'test' | 'deploy';

/**
 * useAppNavigation hook의 반환 타입
 */

export interface UseAppNavigationReturn {
  // 상태
  activeSection: AppSection;
  creatingMCPTool: boolean;
  creatingAgent: boolean;
  creatingCustomTool: boolean;
  agentCreationStep: AgentCreationStep;
  mcpCreationStep: McpCreationStep;
  customToolCreationStep: CustomToolCreationStep;

  // 액션들
  setActiveSection: (section: AppSection) => void;
  handleBackToChat: () => void;
  handleBackToTools: () => void;
  handleBackToAgents: () => void;
  handleBackToToolBuilder: () => void;
  handleStartCreateMCPTool: (step?: McpCreationStep) => void;
  handleStartCreateAgent: (step?: AgentCreationStep) => void;
  handleStartCreateCustomTool: () => void;
  setAgentCreationStep: (step: AgentCreationStep) => void;
  setMcpCreationStep: (step: McpCreationStep) => void;
  setCustomToolCreationStep: (step: CustomToolCreationStep) => void;

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
  mentionableAgents: ReadonlyAgentMetadata[];
  activeAgents: ReadonlyAgentMetadata[];
  showEmptyState: boolean;
  setShowEmptyState: (show: boolean) => void;
  loading: boolean; // 로딩 상태
  error: Error | null; // 에러 상태 추가
  handleUpdateAgentStatus: (agentId: string, status: AgentStatus) => Promise<void>;
  handleCreateMCPTool: (mcpConfig: McpConfig) => Promise<unknown>;
  handleCreateAgent: (agent: CreateAgentMetadata) => Promise<ReadonlyAgentMetadata>;
  handleCreateCustomTool: (toolData: unknown) => Promise<unknown>;
  getMentionableAgents: () => ReadonlyAgentMetadata[];
  getActiveAgents: () => ReadonlyAgentMetadata[];
  reloadAgents: () => Promise<void>; // Agent 생성 후 수동 동기화용
}
