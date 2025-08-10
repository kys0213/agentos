import {
  AgentProtocol,
  BuiltinToolProtocol,
  LlmBridgeProtocol,
  McpProtocol,
  McpUsageLogProtocol,
  PresetProtocol,
} from './ipc-channel';

export interface AgentOsAPI {
  agent: AgentProtocol;
  bridge: LlmBridgeProtocol;
  builtinTool: BuiltinToolProtocol;
  mcp: McpProtocol;
  preset: PresetProtocol;
  mcpUsageLog: McpUsageLogProtocol;
}

export type AgentOsServiceName = keyof AgentOsAPI;

export const AgentOsServiceNames: AgentOsServiceName[] = [
  'agent',
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
