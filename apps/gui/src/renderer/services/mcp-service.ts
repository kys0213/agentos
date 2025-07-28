import type { McpAPI } from '../../shared/types/electron-api';

// IPC 기반 MCP 서비스 클라이언트
export class McpService {
  private get api(): McpAPI {
    return window.electronAPI.mcp;
  }

  async getAll() {
    return this.api.getAll();
  }

  async connect(config: any) {
    return this.api.connect(config);
  }

  async disconnect(name: string) {
    return this.api.disconnect(name);
  }
}

export const mcpService = new McpService();