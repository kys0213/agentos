import type { McpConfig } from '@agentos/core';
import { McpServiceAdapter } from '../rpc/adapters/mcp.adapter';
import { ServiceContainer } from '../../shared/di/service-container';

// RPC 기반 MCP 설정 스토어 (브라우저 호환)
// ServiceContainer에 등록된 McpServiceAdapter를 사용합니다.
export class McpConfigStore {
  private cachedConfig: McpConfig | undefined;
  private get mcpService(): McpServiceAdapter {
    return ServiceContainer.getOrThrow('mcp') as McpServiceAdapter;
  }

  async get(): Promise<McpConfig | undefined> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    try {
      const configs = await this.mcpService.getAllMcp();
      // 첫 번째 설정을 반환 (단일 설정 가정)
      this.cachedConfig = configs[0];
      return this.cachedConfig;
    } catch (error) {
      console.error('Failed to get MCP config:', error);
      return undefined;
    }
  }

  async set(config: McpConfig): Promise<void> {
    try {
      await this.mcpService.connectMcp(config);
      this.cachedConfig = config;
    } catch (error) {
      console.error('Failed to set MCP config:', error);
      throw error;
    }
  }

  // 동기 버전 (기존 코드 호환성)
  getSyncCached(): McpConfig | undefined {
    return this.cachedConfig;
  }
}
