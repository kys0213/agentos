import type { IpcChannel } from './ipc/IpcChannel';
import type {
  McpConfig,
  ToolExecutionResponse,
  ResourceListResponse,
  ResourceResponse,
} from '../types/core-types';

/**
 * MCP 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class McpService {
  constructor(private ipcChannel: IpcChannel) {}

  // ==================== 기본 MCP 메서드들 ====================

  async getAll(): Promise<McpConfig[]> {
    return this.ipcChannel.getAllMcp();
  }

  async connect(config: McpConfig): Promise<{ success: boolean }> {
    return this.ipcChannel.connectMcp(config);
  }

  async disconnect(name: string): Promise<{ success: boolean }> {
    return this.ipcChannel.disconnectMcp(name);
  }

  async executeTool(
    clientName: string,
    toolName: string,
    args: any
  ): Promise<ToolExecutionResponse> {
    return this.ipcChannel.executeMcpTool(clientName, toolName, args);
  }

  async getResources(clientName: string): Promise<ResourceListResponse> {
    return this.ipcChannel.getMcpResources(clientName);
  }

  async readResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.ipcChannel.readMcpResource(clientName, uri);
  }

  async getStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.ipcChannel.getMcpStatus(clientName);
  }

  // ==================== 편의 메서드들 ====================

  /**
   * 특정 이름의 MCP 클라이언트가 연결되어 있는지 확인
   */
  async isConnected(name: string): Promise<boolean> {
    try {
      const status = await this.getStatus(name);
      return status.connected;
    } catch {
      return false;
    }
  }

  /**
   * 연결된 MCP 클라이언트 수 반환
   */
  async getConnectedCount(): Promise<number> {
    const clients = await this.getAll();
    let connectedCount = 0;

    for (const client of clients) {
      const isConnected = await this.isConnected(client.name);
      if (isConnected) {
        connectedCount++;
      }
    }

    return connectedCount;
  }

  /**
   * 특정 클라이언트의 모든 리소스를 URI 목록으로 반환
   */
  async getResourceUris(clientName: string): Promise<string[]> {
    const resources = await this.getResources(clientName);
    return resources.resources.map((resource) => resource.uri);
  }

  /**
   * MCP 클라이언트 설정을 이름으로 조회
   */
  async getConfigByName(name: string): Promise<McpConfig | null> {
    const clients = await this.getAll();
    return clients.find((client) => client.name === name) || null;
  }
}
