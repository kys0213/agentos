import type { IpcChannel } from './IpcChannel';
import type {
  ChatSessionDescription,
  Preset,
  McpConfig,
  SendMessageResponse,
  ToolExecutionResponse,
  ResourceListResponse,
  ResourceResponse,
  MessageListResponse,
  PaginationOptions,
  LlmBridgeConfig,
  McpToolArgs,
} from '../../types/core-types';

/**
 * Electron 환경에서 사용되는 IpcChannel 구현체
 * window.electronAPI를 통해 Main 프로세스와 IPC 통신
 */
export class ElectronIpcChannel implements IpcChannel {
  private get electronAPI() {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error(
        'ElectronAPI is not available. Make sure you are running in Electron environment.'
      );
    }
    return window.electronAPI;
  }

  // ==================== Chat 관련 메서드들 ====================

  async createChatSession(options?: { preset?: Preset }): Promise<ChatSessionDescription> {
    return this.electronAPI.chat.createSession(options);
  }

  async listChatSessions(): Promise<ChatSessionDescription[]> {
    return this.electronAPI.chat.listSessions();
  }

  async loadChatSession(sessionId: string): Promise<ChatSessionDescription> {
    return this.electronAPI.chat.loadSession(sessionId);
  }

  async sendChatMessage(sessionId: string, message: string): Promise<SendMessageResponse> {
    return this.electronAPI.chat.sendMessage(sessionId, message);
  }

  async streamChatMessage(sessionId: string, message: string): Promise<ReadableStream> {
    return this.electronAPI.chat.streamMessage(sessionId, message);
  }

  async getChatMessages(
    sessionId: string,
    options?: PaginationOptions
  ): Promise<MessageListResponse> {
    return this.electronAPI.chat.getMessages(sessionId, options);
  }

  async deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    return this.electronAPI.chat.deleteSession(sessionId);
  }

  async renameChatSession(sessionId: string, newName: string): Promise<{ success: boolean }> {
    return this.electronAPI.chat.renameSession(sessionId, newName);
  }

  // ==================== Bridge 관련 메서드들 ====================

  async registerBridge(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }> {
    return this.electronAPI.bridge.register(id, config);
  }

  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    return this.electronAPI.bridge.unregister(id);
  }

  async switchBridge(id: string): Promise<{ success: boolean }> {
    return this.electronAPI.bridge.switch(id);
  }

  async getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null> {
    return this.electronAPI.bridge.getCurrent();
  }

  async getBridgeIds(): Promise<string[]> {
    return this.electronAPI.bridge.getIds();
  }

  async getBridgeConfig(id: string): Promise<LlmBridgeConfig | null> {
    return this.electronAPI.bridge.getConfig(id);
  }

  // ==================== MCP 관련 메서드들 ====================

  async getAllMcp(): Promise<McpConfig[]> {
    return this.electronAPI.mcp.getAll();
  }

  async connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    return this.electronAPI.mcp.connect(config);
  }

  async disconnectMcp(name: string): Promise<{ success: boolean }> {
    return this.electronAPI.mcp.disconnect(name);
  }

  async executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolArgs
  ): Promise<ToolExecutionResponse> {
    return this.electronAPI.mcp.executeTool(clientName, toolName, args);
  }

  async getMcpResources(clientName: string): Promise<ResourceListResponse> {
    return this.electronAPI.mcp.getResources(clientName);
  }

  async readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.electronAPI.mcp.readResource(clientName, uri);
  }

  async getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.electronAPI.mcp.getStatus(clientName);
  }

  // ==================== Preset 관련 메서드들 ====================

  async getAllPresets(): Promise<Preset[]> {
    return this.electronAPI.preset.getAll();
  }

  async createPreset(preset: Preset): Promise<{ success: boolean }> {
    return this.electronAPI.preset.create(preset);
  }

  async updatePreset(preset: Preset): Promise<{ success: boolean }> {
    return this.electronAPI.preset.update(preset);
  }

  async deletePreset(id: string): Promise<{ success: boolean }> {
    return this.electronAPI.preset.delete(id);
  }

  async getPreset(id: string): Promise<Preset | null> {
    return this.electronAPI.preset.get(id);
  }
}
