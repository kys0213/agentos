import { setupAllIpcHandlers } from './services';

// IPC handlers for core functionality
export function setupCoreIpcHandlers() {
  // 각 도메인별 IPC 핸들러 등록 (의존성은 각 핸들러에서 관리)
  setupAllIpcHandlers();
}
