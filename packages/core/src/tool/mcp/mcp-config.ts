import { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import { StreamableHTTPReconnectionOptions } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface BaseMcpConfig {
  type: 'stdio' | 'streamableHttp' | 'websocket' | 'sse';
  name: string;
  version: string;
  network?: NetworkConfig;
}

export interface NetworkConfig {
  timeoutMs?: number;
  maxTotalTimeoutMs?: number;
  maxConnectionIdleTimeoutMs?: number;
}

export interface StdioMcpConfig extends BaseMcpConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

/**
 * TODO authProvider 설정 고민..
 */
export interface StreamableHttpMcpConfig extends BaseMcpConfig {
  type: 'streamableHttp';
  url: string;
  headers?: Record<string, string>;
  authProvider?: OAuthClientProvider;
  reconnectionOptions?: StreamableHTTPReconnectionOptions;
}

export interface WebSocketMcpConfig extends BaseMcpConfig {
  type: 'websocket';
  url: string;
}

/**
 * @deprecated
 * @remarks mcp-protocol 에서 SSE 는 더이상 지원하지 않습니다. 대신 streamableHttp 를 사용해주세요.
 */
export interface SseMcpConfig extends BaseMcpConfig {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
  authProvider?: OAuthClientProvider;
}

export type McpConfig =
  | StdioMcpConfig
  | StreamableHttpMcpConfig
  | WebSocketMcpConfig
  | SseMcpConfig;
