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
  AgentMetadata,
} from '../../types/core-types';
import type { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  UsageLogQueryOptions,
  McpUsageUpdateEvent,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
} from '../../../shared/types/mcp-usage-types';

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

  // ==================== MCP 사용량 추적 메서드들 ====================

  async getToolMetadata(clientName: string): Promise<McpToolMetadata> {
    return this.electronAPI.mcp.getToolMetadata(clientName);
  }

  async getAllToolMetadata(): Promise<McpToolMetadata[]> {
    return this.electronAPI.mcp.getAllToolMetadata();
  }

  async getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.electronAPI.mcp.getUsageLogs(clientName, options);
  }

  async getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.electronAPI.mcp.getAllUsageLogs(options);
  }

  async getUsageStats(clientName?: string): Promise<McpUsageStats> {
    return this.electronAPI.mcp.getUsageStats(clientName);
  }

  async getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse> {
    return this.electronAPI.mcp.getHourlyStats(date, clientName);
  }

  async getUsageLogsInRange(
    startDate: Date,
    endDate: Date,
    clientName?: string
  ): Promise<McpUsageLog[]> {
    return this.electronAPI.mcp.getUsageLogsInRange(startDate, endDate, clientName);
  }

  async clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return this.electronAPI.mcp.clearUsageLogs(olderThan);
  }

  async setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse> {
    return this.electronAPI.mcp.setUsageTracking(clientName, enabled);
  }

  async subscribeToUsageUpdates(
    callback: (event: McpUsageUpdateEvent) => void
  ): Promise<() => void> {
    // 구독 설정을 위한 IPC 호출
    await this.electronAPI.mcp.subscribeToUsageUpdates(callback);

    // 실제 이벤트 구독은 Main Process에서 webContents.send로 전송되므로
    // Renderer에서 ipcRenderer.on으로 수신
    const { ipcRenderer } = window.require('electron');

    const eventHandler = (_event: any, updateEvent: McpUsageUpdateEvent) => {
      callback(updateEvent);
    };

    ipcRenderer.on('mcp:usage-update', eventHandler);

    // 구독 해제 함수 반환
    return () => {
      ipcRenderer.removeListener('mcp:usage-update', eventHandler);
    };
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

  // ==================== Agent 관련 메서드들 (TODO: Main Process 구현 필요) ====================

  async getAllAgents(): Promise<AgentMetadata[]> {
    // TODO: Main Process에 Agent API 구현 필요
    return [];
  }

  async createAgent(_agent: AgentMetadata): Promise<{ success: boolean }> {
    // TODO: Main Process에 Agent API 구현 필요
    return { success: false };
  }

  async updateAgent(_agent: AgentMetadata): Promise<{ success: boolean }> {
    // TODO: Main Process에 Agent API 구현 필요
    return { success: false };
  }

  async deleteAgent(_id: string): Promise<{ success: boolean }> {
    // TODO: Main Process에 Agent API 구현 필요
    return { success: false };
  }

  async getAgent(_id: string): Promise<AgentMetadata | null> {
    // TODO: Main Process에 Agent API 구현 필요
    return null;
  }

  async getAvailableAgents(): Promise<AgentMetadata[]> {
    // TODO: Main Process에 Agent API 구현 필요
    return [];
  }

  async getActiveAgents(): Promise<AgentMetadata[]> {
    // TODO: Main Process에 Agent API 구현 필요
    return [];
  }
}
