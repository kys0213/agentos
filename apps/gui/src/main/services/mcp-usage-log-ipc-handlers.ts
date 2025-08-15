import { BrowserWindow } from 'electron';

/**
 * @deprecated 이 파일은 deprecated 됩니다.
 * 새로운 MCP Service 구조에서는 mcp-ipc-handlers.ts를 사용하세요.
 *
 * 모든 MCP 관련 IPC 핸들러는 mcp-ipc-handlers.ts에서 통합 관리됩니다.
 */

export function setupMcpUsageLogIpcHandlers(window?: BrowserWindow) {
  // 현재는 stub 구현
  // TODO: 이 파일을 완전히 제거하고 mcp-ipc-handlers.ts로 마이그레이션
  console.log('MCP Usage Log IPC Handlers are deprecated. Use mcp-ipc-handlers.ts instead.');
}

export function cleanupMcpUsageLogIpcHandlers() {
  // cleanup stub
}
