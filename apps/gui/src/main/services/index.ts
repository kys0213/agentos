import { setupAgentIpcHandlers } from './agent-ipc-handlers';
import { setupBuiltinToolIpcHandlers } from './builtin-tool-ipc-handlers';
import { setupMcpIpcHandlers } from './mcp-ipc-handlers';
// legacy usage/preset handlers removed (migrated to Nest controllers)
import { setupBridgeIpcHandlers } from './bridge-ipc-handlers';
import { setupChatIpcHandlers } from './chat-ipc-handlers';

export function setupAllIpcHandlers() {
  // AgentOS API 스펙에 맞춘 도메인별 IPC 핸들러 등록
  setupAgentIpcHandlers();
  setupBuiltinToolIpcHandlers();
  setupMcpIpcHandlers();
  setupBridgeIpcHandlers();
  setupChatIpcHandlers();

  console.log('All IPC handlers registered successfully');
}
