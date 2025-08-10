import type {
  Agent,
  AgentStatus,
  ChatSessionMetadata,
  McpConfig,
  Preset,
  ReadonlyAgentMetadata,
  ReadonlyPreset,
} from '@agentos/core';
export type { Preset } from '@agentos/core';

// Minimal service interfaces used in hooks (for typing only)
export interface PresetServiceInterface {
  getAllPresets(): Promise<Preset[]>;
  getPreset(id: string): Promise<Preset | null>;
  createPreset(preset: any): Promise<Preset>;
  updatePreset(id: string, preset: Partial<Omit<Preset, 'id'>>): Promise<Preset>;
  deletePreset(id: string): Promise<Preset>;
}

export interface McpServiceInterface {
  getAllMcp(): Promise<McpConfig[]>;
  connectMcp(config: McpConfig): Promise<{ success: boolean }>;
  disconnectMcp(name: string): Promise<{ success: boolean }>;
  getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }>;
  // usage methods (compat)
  getUsageLogs(clientName: string, options?: any): Promise<any[]>;
  getAllUsageLogs(options?: any): Promise<any[]>;
}

// IPC 통신을 위한 추가 타입들
export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ToolExecutionResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface ResourceListResponse {
  resources: Array<{
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
  }>;
}

export interface ResourceResponse {
  uri: string;
  mimeType?: string;
  content: string | ArrayBuffer;
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  offset?: number;
}

// Chrome Extension 메시지 타입들
export interface ChromeExtensionMessage<T = unknown> {
  action: string;
  payload?: T;
}

export interface ChromeExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

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
// QuickAction 타입 (chat-types.ts에서 이동)

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<Record<string, unknown>>;
  description: string;
  category: 'chat' | 'management' | 'settings' | 'navigation';
}
// 앱 모드 상태 관리 (chat-types.ts에서 이동)

export interface AppModeState {
  mode: 'chat' | 'management';
  activeSection: AppSection;
}

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
  loading: boolean; // 로딩 상태
  error: Error | null; // 에러 상태 추가
  handleUpdateAgentStatus: (agentId: string, status: AgentStatus) => Promise<void>;
  handleCreatePreset: (preset: Partial<ReadonlyPreset>) => Promise<ReadonlyPreset>;
  handleCreateMCPTool: (mcpConfig: McpConfig) => Promise<unknown>;
  handleCreateAgent: (agent: Partial<ReadonlyAgentMetadata>) => Promise<ReadonlyAgentMetadata>;
  handleCreateCustomTool: (toolData: unknown) => Promise<unknown>;
  handleUpdatePreset: (preset: Preset) => Promise<void>;
  handleDeletePreset: (presetId: string) => Promise<void>;
  getMentionableAgents: () => ReadonlyAgentMetadata[];
  getActiveAgents: () => ReadonlyAgentMetadata[];
}
