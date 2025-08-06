import type { ChatSessionDescription, Preset, McpConfig } from '../../renderer/types/core-types';
import type { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  UsageLogQueryOptions,
  McpUsageUpdateEvent,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
} from './mcp-usage-types';

// 로컬 응답 타입들 (중복 방지)
export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ToolExecutionResponse {
  success: boolean;
  result?: any;
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

export interface MessageListResponse {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: any;
    timestamp: Date;
  }>;
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

// Main과 Renderer 간 IPC 통신을 위한 정확한 타입 정의

// IPC 요청 페이로드 타입들
export interface CreateSessionRequest {
  preset?: Preset;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

export interface ConnectMcpClientRequest {
  config: McpConfig;
}

export interface SavePresetRequest {
  preset: Preset;
}

// IPC 응답 타입들
export interface CreateSessionResponse {
  sessionId: string;
  success: boolean;
}

export interface ListSessionsResponse {
  items: ChatSessionDescription[];
}

export interface LoadSessionResponse {
  session: ChatSessionDescription;
  success: boolean;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
}

export interface McpClientResponse {
  clients: McpConfig[];
}

export interface PresetResponse {
  presets: Preset[];
}

// IPC API 인터페이스 (preload.ts와 renderer에서 공통 사용)
export interface ChatAPI {
  createSession: (options?: CreateSessionRequest) => Promise<ChatSessionDescription>;
  listSessions: () => Promise<ChatSessionDescription[]>;
  loadSession: (sessionId: string) => Promise<ChatSessionDescription>;
  sendMessage: (sessionId: string, message: string) => Promise<SendMessageResponse>;
  streamMessage: (sessionId: string, message: string) => Promise<ReadableStream>;
  getMessages: (sessionId: string, options?: any) => Promise<MessageListResponse>;
  deleteSession: (sessionId: string) => Promise<{ success: boolean }>;
  renameSession: (sessionId: string, newName: string) => Promise<{ success: boolean }>;
}

export interface BridgeAPI {
  register: (id: string, config: any) => Promise<{ success: boolean }>;
  unregister: (id: string) => Promise<{ success: boolean }>;
  switch: (id: string) => Promise<{ success: boolean }>;
  getCurrent: () => Promise<{ id: string; config: any } | null>;
  getIds: () => Promise<string[]>;
  getConfig: (id: string) => Promise<any | null>;
}

export interface McpAPI {
  // ==================== 기존 기본 기능들 ====================
  getAll: () => Promise<McpConfig[]>;
  connect: (config: McpConfig) => Promise<{ success: boolean }>;
  disconnect: (name: string) => Promise<{ success: boolean }>;
  executeTool: (clientName: string, toolName: string, args: any) => Promise<ToolExecutionResponse>;
  getResources: (clientName: string) => Promise<ResourceListResponse>;
  readResource: (clientName: string, uri: string) => Promise<ResourceResponse>;
  getStatus: (clientName: string) => Promise<{ connected: boolean; error?: string }>;

  // ==================== 새로운 사용량 추적 기능들 ====================
  
  /**
   * MCP 도구 메타데이터 조회
   */
  getToolMetadata: (clientName: string) => Promise<McpToolMetadata>;
  
  /**
   * 모든 MCP 도구들의 메타데이터 일괄 조회
   */
  getAllToolMetadata: () => Promise<McpToolMetadata[]>;
  
  /**
   * 특정 도구의 사용량 로그 조회
   */
  getUsageLogs: (clientName: string, options?: UsageLogQueryOptions) => Promise<McpUsageLog[]>;
  
  /**
   * 전체 사용량 로그 조회
   */
  getAllUsageLogs: (options?: UsageLogQueryOptions) => Promise<McpUsageLog[]>;
  
  /**
   * 사용량 통계 조회
   */
  getUsageStats: (clientName?: string) => Promise<McpUsageStats>;
  
  /**
   * 시간별 사용량 통계 조회
   */
  getHourlyStats: (date: Date, clientName?: string) => Promise<HourlyStatsResponse>;
  
  /**
   * 기간별 사용량 로그 조회
   */
  getUsageLogsInRange: (startDate: Date, endDate: Date, clientName?: string) => Promise<McpUsageLog[]>;
  
  /**
   * 사용량 로그 정리
   */
  clearUsageLogs: (olderThan?: Date) => Promise<ClearUsageLogsResponse>;
  
  /**
   * 사용량 추적 활성화/비활성화
   */
  setUsageTracking: (clientName: string, enabled: boolean) => Promise<SetUsageTrackingResponse>;
  
  /**
   * 사용량 변경 이벤트 구독
   */
  subscribeToUsageUpdates: (callback: (event: McpUsageUpdateEvent) => void) => Promise<() => void>;
}

export interface PresetAPI {
  getAll: () => Promise<Preset[]>;
  create: (preset: Preset) => Promise<{ success: boolean }>;
  update: (preset: Preset) => Promise<{ success: boolean }>;
  delete: (id: string) => Promise<{ success: boolean }>;
  get: (id: string) => Promise<Preset | null>;
}

export interface ElectronAPI {
  chat: ChatAPI;
  bridge: BridgeAPI;
  mcp: McpAPI;
  preset: PresetAPI;
}

// Window 인터페이스 확장 (renderer에서 사용)
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
