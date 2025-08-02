// Renderer 프로세스에서 사용하는 로컬 타입 정의
// Main 프로세스와 IPC를 통해 데이터를 주고받을 때 사용

export interface ChatSessionDescription {
  id: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  preset?: Preset;
}

export interface EnabledMcp {
  name: string;
  version?: string;
  enabledTools: string[];
  enabledResources: string[];
  enabledPrompts: string[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  systemPrompt: string;
  enabledMcps?: EnabledMcp[];
  llmBridgeName: string;
  llmBridgeConfig: Record<string, unknown>;
}

export interface McpConfig {
  type: 'stdio' | 'streamableHttp' | 'websocket' | 'sse';
  name: string;
  version: string;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
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

export interface MessageRecord {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | object;
  timestamp: Date;
}

export interface MessageListResponse {
  messages: MessageRecord[];
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  offset?: number;
}

// Bridge 설정 관련 타입들
export interface LlmBridgeConfig {
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  headers?: Record<string, string>;
  [key: string]: unknown; // 확장 가능한 설정을 위한 인덱스 시그니처
}

// MCP 도구 실행 인자 타입
export interface McpToolArgs {
  [key: string]: string | number | boolean | object | null | undefined;
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

// HTTP API 요청/응답 관련 타입들
export interface HttpApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

// 서비스 컨테이너에서 사용하는 알려진 서비스 타입들
export interface ServiceRegistry {
  chat: ChatService;
  bridge: BridgeService;
  mcp: McpService;
  preset: PresetService;
  ipcChannel: IpcChannel;
}

// Forward declarations (순환 참조 방지)
export interface ChatService {
  createSession(options?: { preset?: Preset }): Promise<ChatSessionDescription>;
  listSessions(): Promise<ChatSessionDescription[]>;
  loadSession(sessionId: string): Promise<ChatSessionDescription>;
  sendMessage(sessionId: string, message: string): Promise<SendMessageResponse>;
}

export interface BridgeService {
  register(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }>;
  switchBridge(id: string): Promise<{ success: boolean }>;
  getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null>;
  getBridgeIds(): Promise<string[]>;
}

export interface McpService {
  getAll(): Promise<McpConfig[]>;
  connect(config: McpConfig): Promise<{ success: boolean }>;
  disconnect(name: string): Promise<{ success: boolean }>;
}

export interface PresetService {
  getAll(): Promise<Preset[]>;
  create(preset: Preset): Promise<{ success: boolean }>;
  update(preset: Preset): Promise<{ success: boolean }>;
  delete(id: string): Promise<{ success: boolean }>;
}

// IpcChannel interface - forward declaration for ServiceRegistry
export interface IpcChannel {
  // Chat methods
  createChatSession(options?: { preset?: Preset }): Promise<ChatSessionDescription>;
  listChatSessions(): Promise<ChatSessionDescription[]>;
  loadChatSession(sessionId: string): Promise<ChatSessionDescription>;
  sendChatMessage(sessionId: string, message: string): Promise<SendMessageResponse>;
  getChatMessages(sessionId: string, options?: PaginationOptions): Promise<MessageListResponse>;

  // Bridge methods
  registerBridge(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }>;
  getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null>;
  getBridgeIds(): Promise<string[]>;

  // MCP methods
  getAllMcp(): Promise<McpConfig[]>;
  connectMcp(config: McpConfig): Promise<{ success: boolean }>;
  executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolArgs
  ): Promise<ToolExecutionResponse>;

  // Preset methods
  getAllPresets(): Promise<Preset[]>;
}
