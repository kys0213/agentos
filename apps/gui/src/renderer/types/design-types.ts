/**
 * 새 디자인 타입들을 기존 Core 타입과 매핑하는 호환성 레이어
 * Design/types를 Core 타입과 통합하여 타입 안전성 보장
 */

// Core 타입들 import (절대 변경하지 않음)
import type {
  Preset as CorePreset,
  McpConfig as CoreMcpConfig,
  ChatSessionMetadata,
  MessageHistory,
} from '@agentos/core';

// 기존 renderer 타입들 재사용
import type {
  ChatSessionDescription,
  SendMessageResponse,
  ToolExecutionResponse,
} from './core-types';

// ===== 새 디자인의 타입들을 Core와 호환되도록 확장 =====

/**
 * 새 디자인의 Preset 타입을 Core Preset과 호환되도록 확장
 * Core의 Preset을 기반으로 하되, UI 전용 필드들을 옵셔널로 추가
 */
export interface DesignPreset extends CorePreset {
  // Core에서 제공하지 않는 UI 전용 필드들 (모두 옵셔널)
  usageCount?: number;
  knowledgeDocuments?: number;
  knowledgeStats?: {
    indexed: number;
    vectorized: number;
    totalSize: number;
  };
  // status는 이미 Core에 있으므로 재정의하지 않음
}

/**
 * 새 디자인의 Agent 타입
 * Core에는 Agent 개념이 없으므로 GUI 레벨에서만 정의
 * 실제로는 AgentMetadata나 ChatSession과 매핑될 것
 */
export interface DesignAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "idle" | "inactive";
  preset: string; // Preset ID 참조 (CorePreset.id와 매핑)
  // UI 전용 필드들
  avatar?: string;
  lastUsed?: Date;
  usageCount: number;
  tags?: string[];
}

/**
 * 채팅용 에이전트 간소화 타입 (기존과 유지)
 */
export interface DesignChatAgent {
  id: number;
  name: string;
  preset: string;
}

/**
 * 앱 섹션 타입 확장 - 새 디자인의 모든 섹션 포함
 */
export type AppSection = 
  | "dashboard" 
  | "chat" 
  | "subagents" 
  | "presets" 
  | "models" 
  | "tools" 
  | "toolbuilder" 
  | "racp" 
  | "settings";

/**
 * 네비게이션 상태 관리를 위한 타입들
 */
export interface NavigationState {
  activeSection: AppSection;
  selectedPreset: DesignPreset | null;
  creatingPreset: boolean;
  creatingMCPTool: boolean;
  creatingAgent: boolean;
  creatingCustomTool: boolean;
}

/**
 * 채팅 상태 관리를 위한 타입들
 */
export interface ChatState {
  activeChatAgent: DesignChatAgent | null;
  minimizedChats: DesignChatAgent[];
}

/**
 * 앱 데이터 상태를 위한 타입들
 */
export interface AppDataState {
  presets: DesignPreset[];
  currentAgents: DesignAgent[];
  showEmptyState: boolean;
}

// ===== Core 타입들 재export (호환성을 위해) =====

export type { 
  CorePreset,
  CoreMcpConfig,
  ChatSessionMetadata, 
  MessageHistory,
  ChatSessionDescription,
  SendMessageResponse,
  ToolExecutionResponse,
};

// ===== 유틸리티 타입들 =====

/**
 * Core Preset을 Design Preset으로 변환하는 유틸리티 타입
 */
export type CoreToDesignPreset<T extends CorePreset> = T & {
  usageCount?: number;
  knowledgeDocuments?: number;
  knowledgeStats?: {
    indexed: number;
    vectorized: number;
    totalSize: number;
  };
};

/**
 * Design Preset을 Core Preset으로 변환 (UI 전용 필드 제거)
 */
export type DesignToCorePreset<T extends DesignPreset> = Omit<
  T, 
  'usageCount' | 'knowledgeDocuments' | 'knowledgeStats'
>;

// ===== Hook 관련 타입들 =====

/**
 * useAppNavigation hook의 반환 타입
 */
export interface UseAppNavigationReturn {
  // 상태
  activeSection: AppSection;
  selectedPreset: DesignPreset | null;
  creatingPreset: boolean;
  creatingMCPTool: boolean;
  creatingAgent: boolean;
  creatingCustomTool: boolean;
  
  // 액션들
  setActiveSection: (section: AppSection) => void;
  handleBackToChat: () => void;
  handleSelectPreset: (preset: DesignPreset) => void;
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
  activeChatAgent: DesignChatAgent | null;
  minimizedChats: DesignChatAgent[];
  handleOpenChat: (agent: DesignAgent) => void;
  handleCloseChat: () => void;
  handleMinimizeChat: () => void;
  handleRestoreChat: (agent: DesignChatAgent) => void;
}

/**
 * useAppData hook의 반환 타입
 */
export interface UseAppDataReturn {
  presets: DesignPreset[];
  currentAgents: DesignAgent[];
  showEmptyState: boolean;
  setShowEmptyState: (show: boolean) => void;
  handleUpdateAgentStatus: (agentId: string, status: DesignAgent['status']) => void;
  handleCreatePreset: (preset: Partial<DesignPreset>) => DesignPreset;
  handleCreateMCPTool: (mcpConfig: CoreMcpConfig) => unknown;
  handleCreateAgent: (agent: Partial<DesignAgent>) => DesignAgent;
  handleCreateCustomTool: (toolData: unknown) => unknown;
  handleUpdatePreset: (preset: DesignPreset) => void;
  handleDeletePreset: (presetId: string) => void;
  getMentionableAgents: () => DesignAgent[];
  getActiveAgents: () => DesignAgent[];
}