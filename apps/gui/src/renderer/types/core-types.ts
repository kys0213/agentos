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
  llmBridgeConfig: Record<string, any>;
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
