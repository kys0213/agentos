import type { ChatSessionDescription, Preset, McpConfig } from '../../renderer/types/core-types';

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
  createSession: (options?: CreateSessionRequest) => Promise<CreateSessionResponse>;
  listSessions: () => Promise<ListSessionsResponse>;
  loadSession: (sessionId: string) => Promise<LoadSessionResponse>;
  sendMessage: (sessionId: string, message: string) => Promise<SendMessageResponse>;
}

export interface McpAPI {
  getAll: () => Promise<McpClientResponse>;
  connect: (config: McpConfig) => Promise<{ success: boolean }>;
  disconnect: (name: string) => Promise<{ success: boolean }>;
}

export interface PresetAPI {
  getAll: () => Promise<PresetResponse>;
  create: (preset: Preset) => Promise<{ success: boolean }>;
  update: (preset: Preset) => Promise<{ success: boolean }>;
  delete: (id: string) => Promise<{ success: boolean }>;
}

export interface ElectronAPI {
  chat: ChatAPI;
  mcp: McpAPI;
  preset: PresetAPI;
}

// Window 인터페이스 확장 (renderer에서 사용)
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}