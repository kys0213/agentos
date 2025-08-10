import { PresetProtocol } from './proset-protocol';
import { McpUsageLogProtocol } from './mcp-usage-log-protocol';
import { BuiltinToolProtocol } from './builtin-protocol';
import { McpProtocol } from './mcp-protocol';
import { LlmBridgeProtocol } from './llm-bridge-protocol';
import { AgentProtocol, ConversationProtocol } from './agent-protocol';

export interface AgentOsAPI {
  agent: AgentProtocol;
  conversation: ConversationProtocol;
  bridge: LlmBridgeProtocol;
  builtinTool: BuiltinToolProtocol;
  mcp: McpProtocol;
  preset: PresetProtocol;
  mcpUsageLog: McpUsageLogProtocol;
}

export type AgentOsServiceName = keyof AgentOsAPI;
export type AgentOsService = AgentOsAPI[AgentOsServiceName];

export const AgentOsServiceNames: AgentOsServiceName[] = [
  'agent',
  'conversation',
  'bridge',
  'builtinTool',
  'mcp',
  'preset',
  'mcpUsageLog',
];

// Window 인터페이스 확장 (renderer에서 사용)
declare global {
  interface Window {
    electronAPI: AgentOsAPI;
  }
}
