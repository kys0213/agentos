import type { IpcChannel } from './IpcChannel';

// Chrome Extension API 타입 선언
declare global {
  const chrome: {
    runtime: {
      sendMessage: (
        message: ChromeExtensionMessage,
        callback: (response: ChromeExtensionResponse) => void
      ) => void;
      lastError?: { message: string };
      id?: string;
    };
  };
}
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
  ChromeExtensionMessage,
  ChromeExtensionResponse,
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
 * Chrome Extension 환경에서 사용되는 IpcChannel 구현체
 * chrome.runtime 메시징을 통해 백그라운드 스크립트와 통신
 */
export class ChromeExtensionIpcChannel implements IpcChannel {
  private sendMessage<T>(action: string, payload?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        reject(
          new Error(
            'Chrome runtime is not available. Make sure you are running in Chrome Extension environment.'
          )
        );
        return;
      }

      chrome.runtime.sendMessage({ action, payload }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data as T);
        }
      });
    });
  }

  // ==================== Chat 관련 메서드들 ====================

  async createChatSession(options?: { preset?: Preset }): Promise<ChatSessionDescription> {
    return this.sendMessage('createChatSession', options);
  }

  async listChatSessions(): Promise<ChatSessionDescription[]> {
    return this.sendMessage('listChatSessions');
  }

  async loadChatSession(sessionId: string): Promise<ChatSessionDescription> {
    return this.sendMessage('loadChatSession', { sessionId });
  }

  async sendChatMessage(sessionId: string, message: string): Promise<SendMessageResponse> {
    return this.sendMessage('sendChatMessage', { sessionId, message });
  }

  async streamChatMessage(sessionId: string, message: string): Promise<ReadableStream> {
    // Chrome Extension에서 ReadableStream 구현은 복잡하므로 기본 구현
    // 실제로는 chrome.runtime.Port를 사용한 스트리밍 구현이 필요
    const response = await this.sendMessage<{ content: string }>('streamChatMessage', {
      sessionId,
      message,
    });

    return new ReadableStream({
      start(controller) {
        controller.enqueue(response.content);
        controller.close();
      },
    });
  }

  async getChatMessages(
    sessionId: string,
    options?: PaginationOptions
  ): Promise<MessageListResponse> {
    return this.sendMessage('getChatMessages', { sessionId, options });
  }

  async deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    return this.sendMessage('deleteChatSession', { sessionId });
  }

  async renameChatSession(sessionId: string, newName: string): Promise<{ success: boolean }> {
    return this.sendMessage('renameChatSession', { sessionId, newName });
  }

  // ==================== Bridge 관련 메서드들 ====================

  async registerBridge(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }> {
    return this.sendMessage('registerBridge', { id, config });
  }

  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    return this.sendMessage('unregisterBridge', { id });
  }

  async switchBridge(id: string): Promise<{ success: boolean }> {
    return this.sendMessage('switchBridge', { id });
  }

  async getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null> {
    return this.sendMessage('getCurrentBridge');
  }

  async getBridgeIds(): Promise<string[]> {
    return this.sendMessage('getBridgeIds');
  }

  async getBridgeConfig(id: string): Promise<LlmBridgeConfig | null> {
    return this.sendMessage('getBridgeConfig', { id });
  }

  // ==================== MCP 관련 메서드들 ====================

  async getAllMcp(): Promise<McpConfig[]> {
    return this.sendMessage('getAllMcp');
  }

  async connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    return this.sendMessage('connectMcp', { config });
  }

  async disconnectMcp(name: string): Promise<{ success: boolean }> {
    return this.sendMessage('disconnectMcp', { name });
  }

  async executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolArgs
  ): Promise<ToolExecutionResponse> {
    return this.sendMessage('executeMcpTool', { clientName, toolName, args });
  }

  async getMcpResources(clientName: string): Promise<ResourceListResponse> {
    return this.sendMessage('getMcpResources', { clientName });
  }

  async readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.sendMessage('readMcpResource', { clientName, uri });
  }

  async getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.sendMessage('getMcpStatus', { clientName });
  }

  // ==================== Preset 관련 메서드들 ====================

  async getAllPresets(): Promise<Preset[]> {
    return this.sendMessage('getAllPresets');
  }

  async createPreset(preset: Preset): Promise<{ success: boolean }> {
    return this.sendMessage('createPreset', { preset });
  }

  async updatePreset(preset: Preset): Promise<{ success: boolean }> {
    return this.sendMessage('updatePreset', { preset });
  }

  async deletePreset(id: string): Promise<{ success: boolean }> {
    return this.sendMessage('deletePreset', { id });
  }

  async getPreset(id: string): Promise<Preset | null> {
    return this.sendMessage('getPreset', { id });
  }

  // ==================== MCP 사용량 추적 메서드들 (Stub 구현) ====================

  async getToolMetadata(_clientName: string): Promise<McpToolMetadata> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async getAllToolMetadata(): Promise<McpToolMetadata[]> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async getUsageLogs(_clientName: string, _options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async getAllUsageLogs(_options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async getUsageStats(_clientName?: string): Promise<McpUsageStats> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async getHourlyStats(_date: Date, _clientName?: string): Promise<HourlyStatsResponse> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async getUsageLogsInRange(
    _startDate: Date,
    _endDate: Date,
    _clientName?: string
  ): Promise<McpUsageLog[]> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async clearUsageLogs(_olderThan?: Date): Promise<ClearUsageLogsResponse> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async setUsageTracking(
    _clientName: string,
    _enabled: boolean
  ): Promise<SetUsageTrackingResponse> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }

  async subscribeToUsageUpdates(
    _callback: (event: McpUsageUpdateEvent) => void
  ): Promise<() => void> {
    throw new Error('MCP usage tracking not implemented in Chrome Extension environment');
  }
}
