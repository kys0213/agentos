import { AgentProtocol, ConversationProtocol } from './agent-protocol';
import { LlmBridgeProtocol } from './llm-bridge-protocol';
import { McpProtocol } from './mcp-protocol';
import { BuiltinToolProtocol } from './builtin-protocol';
import { McpUsageLogProtocol } from './mcp-usage-log-protocol';
import { PresetProtocol } from './proset-protocol';

/**
 * 모든 환경별 통신을 추상화하는 단일 인터페이스
 * Electron, Web, Chrome Extension 등 다양한 환경에서 동일한 인터페이스 제공
 */
export interface IpcChannel
  extends AgentProtocol,
    LlmBridgeProtocol,
    BuiltinToolProtocol,
    McpProtocol,
    PresetProtocol,
    McpUsageLogProtocol,
    ConversationProtocol {}

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
