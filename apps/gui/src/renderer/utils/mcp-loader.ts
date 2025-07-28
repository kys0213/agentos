import { McpConfigStore } from '../stores/mcp-config-store';
import type { McpConfig } from '../types/core-types';

// TODO: MCP를 IPC 서비스로 변환
// 현재는 설정만 로드하고 실제 MCP 인스턴스는 Main 프로세스에서 관리
export async function loadMcpFromStore(store: McpConfigStore): Promise<McpConfig | undefined> {
  const config = await store.get();
  if (!config) {
    return undefined;
  }
  
  // 실제 MCP 인스턴스 생성은 Main 프로세스에서 IPC를 통해 처리
  // TODO: IPC 핸들러에 MCP 등록/해제 API 구현 필요
  return config;
}
