import { ServiceContainer } from '../services/ServiceContainer';
import type { McpService } from '../services/mcp-service';
import type { McpConfig } from '../types/core-types';

/**
 * @deprecated loadMcpFromStore()는 더 이상 사용되지 않습니다.
 * 대신 ServiceContainer.get('mcp') 또는 Services.getMcp()를 사용하세요.
 *
 * 기존 코드와의 호환성을 위해 McpService로 위임하는 래퍼 함수
 */
export async function loadMcpFromStore(store: unknown): Promise<McpConfig | undefined> {
  console.warn('loadMcpFromStore() is deprecated. Use ServiceContainer.get("mcp") instead.');

  const mcpService = ServiceContainer.get<McpService>('mcp');

  try {
    // store에서 설정을 가져오는 대신 MCP 서비스에서 모든 설정 조회
    const configs = await mcpService.getAll();

    // 첫 번째 설정을 반환 (기존 동작과 유사하게)
    return configs.length > 0 ? configs[0] : undefined;
  } catch (error) {
    console.error('Failed to load MCP configs:', error);
    return undefined;
  }
}

/**
 * MCP 설정을 연결하는 헬퍼 함수
 * @deprecated mcpService.connect()를 직접 사용하세요
 */
export async function connectMcp(config: McpConfig): Promise<boolean> {
  console.warn('connectMcp() is deprecated. Use mcpService.connect() instead.');

  const mcpService = ServiceContainer.get<McpService>('mcp');

  try {
    const result = await mcpService.connect(config);
    return result.success;
  } catch (error) {
    console.error('Failed to connect MCP:', error);
    return false;
  }
}

/**
 * MCP 연결을 해제하는 헬퍼 함수
 * @deprecated mcpService.disconnect()를 직접 사용하세요
 */
export async function disconnectMcp(name: string): Promise<boolean> {
  console.warn('disconnectMcp() is deprecated. Use mcpService.disconnect() instead.');

  const mcpService = ServiceContainer.get<McpService>('mcp');

  try {
    const result = await mcpService.disconnect(name);
    return result.success;
  } catch (error) {
    console.error('Failed to disconnect MCP:', error);
    return false;
  }
}

/**
 * 모든 연결된 MCP 조회
 * @deprecated mcpService.getAll()을 직접 사용하세요
 */
export async function getAllMcp(): Promise<McpConfig[]> {
  console.warn('getAllMcp() is deprecated. Use mcpService.getAll() instead.');

  const mcpService = ServiceContainer.get<McpService>('mcp');

  try {
    return await mcpService.getAll();
  } catch (error) {
    console.error('Failed to get all MCP configs:', error);
    return [];
  }
}
