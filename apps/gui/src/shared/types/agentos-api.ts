import { AgentServiceAdapter } from '../../renderer/rpc/adapters/agent.adapter';
import { ConversationServiceAdapter } from '../../renderer/rpc/adapters/conversation.adapter';
import { BridgeServiceAdapter } from '../../renderer/rpc/adapters/bridge.adapter';
import { McpServiceAdapter } from '../../renderer/rpc/adapters/mcp.adapter';
import { PresetServiceAdapter } from '../../renderer/rpc/adapters/preset.adapter';
import { McpUsageRpcService } from '../../renderer/rpc/services/mcp-usage.service';
import { KnowledgeServiceAdapter } from '../../renderer/rpc/adapters/knowledge.adapter';

export interface AgentOsAPI {
  agent: AgentServiceAdapter;
  conversation: ConversationServiceAdapter;
  bridge: BridgeServiceAdapter;
  // builtinTool intentionally dropped until migrated to contracts
  mcp: McpServiceAdapter;
  preset: PresetServiceAdapter;
  mcpUsageLog: McpUsageRpcService;
  knowledge: KnowledgeServiceAdapter;
}

export type AgentOsServiceName = keyof AgentOsAPI;
export type AgentOsService = AgentOsAPI[AgentOsServiceName];

export const AgentOsServiceNames: AgentOsServiceName[] = [
  'agent',
  'conversation',
  'bridge',
  'mcp',
  'preset',
  'mcpUsageLog',
  'knowledge',
];

// Window 인터페이스 확장 (renderer에서 사용)
declare global {
  interface Window {
    electronAPI: AgentOsAPI;
  }
}
