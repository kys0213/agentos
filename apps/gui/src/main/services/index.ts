import { setupChatIpcHandlers } from './chat-ipc-handlers';
import { setupMcpIpcHandlers } from './mcp-ipc-handlers';
import { setupPresetIpcHandlers } from './preset-ipc-handlers';

export function setupAllIpcHandlers() {
  // 각 도메인별 IPC 핸들러 등록 (의존성은 각 핸들러 내부에서 생성)
  setupChatIpcHandlers();
  setupMcpIpcHandlers();
  setupPresetIpcHandlers();

  console.log('All IPC handlers registered successfully');
}
