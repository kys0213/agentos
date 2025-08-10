import { setupAgentIpcHandlers } from './agent-ipc-handlers';
import { setupBuiltinToolIpcHandlers } from './builtin-tool-ipc-handlers';
import { setupMcpIpcHandlers } from './mcp-ipc-handlers';
import { setupMcpUsageLogIpcHandlers } from './mcp-usage-log-ipc-handlers';
import { setupPresetIpcHandlers } from './preset-ipc-handlers';
import { setupBridgeIpcHandlers } from './bridge-ipc-handlers';

export function setupAllIpcHandlers() {
  // AgentOS API 스펙에 맞춘 도메인별 IPC 핸들러 등록
  setupAgentIpcHandlers();
  setupBuiltinToolIpcHandlers();
  setupMcpIpcHandlers();
  setupMcpUsageLogIpcHandlers();
  setupPresetIpcHandlers();
  setupBridgeIpcHandlers();

  console.log('All IPC handlers registered successfully');
}
