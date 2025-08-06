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
import type { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  UsageLogQueryOptions,
  McpUsageUpdateEvent,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
} from '../../../shared/types/mcp-usage-types';

/**
 * 브라우저 환경에서 사용되는 IpcChannel 구현체
 * HTTP API를 통해 백엔드 서버와 통신
 */
export class WebIpcChannel implements IpcChannel {
  private baseUrl = '/api';

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== Chat 관련 메서드들 ====================

  async createChatSession(options?: { preset?: Preset }): Promise<ChatSessionDescription> {
    return this.fetchJson('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async listChatSessions(): Promise<ChatSessionDescription[]> {
    return this.fetchJson('/chat/sessions');
  }

  async loadChatSession(sessionId: string): Promise<ChatSessionDescription> {
    return this.fetchJson(`/chat/sessions/${sessionId}`);
  }

  async sendChatMessage(sessionId: string, message: string): Promise<SendMessageResponse> {
    return this.fetchJson(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async streamChatMessage(sessionId: string, message: string): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.body || new ReadableStream();
  }

  async getChatMessages(
    sessionId: string,
    options?: PaginationOptions
  ): Promise<MessageListResponse> {
    const searchParams = new URLSearchParams();
    if (options?.limit) searchParams.set('limit', options.limit.toString());
    if (options?.cursor) searchParams.set('cursor', options.cursor);
    if (options?.offset) searchParams.set('offset', options.offset.toString());

    const query = searchParams.toString();
    const endpoint = `/chat/sessions/${sessionId}/messages${query ? `?${query}` : ''}`;

    return this.fetchJson(endpoint);
  }

  async deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    return this.fetchJson(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async renameChatSession(sessionId: string, newName: string): Promise<{ success: boolean }> {
    return this.fetchJson(`/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName }),
    });
  }

  // ==================== Bridge 관련 메서드들 ====================

  async registerBridge(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }> {
    return this.fetchJson('/bridge/register', {
      method: 'POST',
      body: JSON.stringify({ id, config }),
    });
  }

  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    return this.fetchJson(`/bridge/${id}`, {
      method: 'DELETE',
    });
  }

  async switchBridge(id: string): Promise<{ success: boolean }> {
    return this.fetchJson('/bridge/current', {
      method: 'PUT',
      body: JSON.stringify({ id }),
    });
  }

  async getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null> {
    return this.fetchJson('/bridge/current');
  }

  async getBridgeIds(): Promise<string[]> {
    return this.fetchJson('/bridge/ids');
  }

  async getBridgeConfig(id: string): Promise<LlmBridgeConfig | null> {
    return this.fetchJson(`/bridge/${id}/config`);
  }

  // ==================== MCP 관련 메서드들 ====================

  async getAllMcp(): Promise<McpConfig[]> {
    return this.fetchJson('/mcp');
  }

  async connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    return this.fetchJson('/mcp/connect', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async disconnectMcp(name: string): Promise<{ success: boolean }> {
    return this.fetchJson(`/mcp/${name}`, {
      method: 'DELETE',
    });
  }

  async executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolArgs
  ): Promise<ToolExecutionResponse> {
    return this.fetchJson(`/mcp/${clientName}/tools/${toolName}/execute`, {
      method: 'POST',
      body: JSON.stringify(args),
    });
  }

  async getMcpResources(clientName: string): Promise<ResourceListResponse> {
    return this.fetchJson(`/mcp/${clientName}/resources`);
  }

  async readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.fetchJson(`/mcp/${clientName}/resources/read`, {
      method: 'POST',
      body: JSON.stringify({ uri }),
    });
  }

  async getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.fetchJson(`/mcp/${clientName}/status`);
  }

  // ==================== Preset 관련 메서드들 ====================

  async getAllPresets(): Promise<Preset[]> {
    return this.fetchJson('/presets');
  }

  async createPreset(preset: Preset): Promise<{ success: boolean }> {
    return this.fetchJson('/presets', {
      method: 'POST',
      body: JSON.stringify(preset),
    });
  }

  async updatePreset(preset: Preset): Promise<{ success: boolean }> {
    return this.fetchJson(`/presets/${preset.id}`, {
      method: 'PUT',
      body: JSON.stringify(preset),
    });
  }

  async deletePreset(id: string): Promise<{ success: boolean }> {
    return this.fetchJson(`/presets/${id}`, {
      method: 'DELETE',
    });
  }

  async getPreset(id: string): Promise<Preset | null> {
    try {
      return await this.fetchJson(`/presets/${id}`);
    } catch (error) {
      // 404인 경우 null 반환
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // ==================== MCP 사용량 추적 메서드들 (Stub 구현) ====================

  async getToolMetadata(_clientName: string): Promise<McpToolMetadata> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async getAllToolMetadata(): Promise<McpToolMetadata[]> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async getUsageLogs(_clientName: string, _options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async getAllUsageLogs(_options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async getUsageStats(_clientName?: string): Promise<McpUsageStats> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async getHourlyStats(_date: Date, _clientName?: string): Promise<HourlyStatsResponse> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async getUsageLogsInRange(
    _startDate: Date,
    _endDate: Date,
    _clientName?: string
  ): Promise<McpUsageLog[]> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async clearUsageLogs(_olderThan?: Date): Promise<ClearUsageLogsResponse> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async setUsageTracking(
    _clientName: string,
    _enabled: boolean
  ): Promise<SetUsageTrackingResponse> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }

  async subscribeToUsageUpdates(
    _callback: (event: McpUsageUpdateEvent) => void
  ): Promise<() => void> {
    throw new Error('MCP usage tracking not implemented in Web environment');
  }
}
