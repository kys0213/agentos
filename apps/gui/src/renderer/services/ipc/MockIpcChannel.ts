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
  MessageRecord,
  PaginationOptions,
  LlmBridgeConfig,
  McpToolArgs,
} from '../../types/core-types';

/**
 * 테스트 환경에서 사용되는 IpcChannel 구현체
 * 메모리 기반으로 모든 데이터를 관리하며, 실제 통신 없이 동작
 */
export class MockIpcChannel implements IpcChannel {
  // Mock 데이터 저장소
  private mockSessions: ChatSessionDescription[] = [];
  private mockBridges: Map<string, LlmBridgeConfig> = new Map();
  private currentBridgeId?: string;
  private mockMcpConfigs: McpConfig[] = [];
  private mockPresets: Preset[] = [];
  private mockMessages: Map<string, MessageRecord[]> = new Map();

  constructor() {
    // 기본 Mock 데이터 초기화
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock Chat Session
    this.mockSessions.push({
      sessionId: 'session-1',
      title: 'Mock Chat Session',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalMessages: 0,
      totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      recentMessages: [],
    });

    // Mock Bridge
    this.mockBridges.set('mock-bridge-1', {
      name: 'Mock Bridge 1',
      type: 'custom',
      apiUrl: 'http://localhost:3000',
    });
    this.currentBridgeId = 'mock-bridge-1';

    // Mock MCP Config
    this.mockMcpConfigs.push({
      type: 'stdio',
      name: 'mock-mcp',
      version: '1.0.0',
      command: 'mock-command',
    });

    // Mock Preset
    this.mockPresets.push({
      id: 'preset-1',
      name: 'Mock Preset',
      description: 'A mock preset for testing',
      author: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      systemPrompt: 'You are a helpful assistant.',
      llmBridgeName: 'mock-bridge',
      llmBridgeConfig: {},
    });
  }

  private delay(ms: number = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==================== Chat 관련 메서드들 ====================

  async createChatSession(options?: { preset?: Preset }): Promise<ChatSessionDescription> {
    await this.delay();

    const session: ChatSessionDescription = {
      sessionId: `session-${Date.now()}`,
      title: `New Chat Session`,
      createdAt: new Date(),
      updatedAt: new Date(),
      preset: options?.preset,
      totalMessages: 0,
      totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      recentMessages: [],
    };

    this.mockSessions.push(session);
    this.mockMessages.set(session.sessionId, []);

    return session;
  }

  async listChatSessions(): Promise<ChatSessionDescription[]> {
    await this.delay();
    return [...this.mockSessions];
  }

  async loadChatSession(sessionId: string): Promise<ChatSessionDescription> {
    await this.delay();

    const session = this.mockSessions.find((s) => s.sessionId === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session;
  }

  async sendChatMessage(sessionId: string, message: string): Promise<SendMessageResponse> {
    await this.delay();

    const messageId = `msg-${Date.now()}`;
    const messages = this.mockMessages.get(sessionId) || [];

    messages.push({
      id: messageId,
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Mock AI response
    messages.push({
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: `Mock response to: ${message}`,
      timestamp: new Date(),
    });

    this.mockMessages.set(sessionId, messages);

    return {
      success: true,
      messageId,
    };
  }

  async streamChatMessage(sessionId: string, message: string): Promise<ReadableStream> {
    await this.delay();

    return new ReadableStream({
      start(controller) {
        const response = `Mock streaming response to: ${message}`;
        controller.enqueue(response);
        controller.close();
      },
    });
  }

  async getChatMessages(
    sessionId: string,
    options?: PaginationOptions
  ): Promise<MessageListResponse> {
    await this.delay();

    const messages = this.mockMessages.get(sessionId) || [];
    const limit = options?.limit || messages.length;
    const offset = options?.offset || 0;

    const slicedMessages = messages.slice(offset, offset + limit);

    return {
      messages: slicedMessages,
      total: messages.length,
      hasMore: offset + limit < messages.length,
    };
  }

  async deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    await this.delay();

    const index = this.mockSessions.findIndex((s) => s.sessionId === sessionId);
    if (index !== -1) {
      this.mockSessions.splice(index, 1);
      this.mockMessages.delete(sessionId);
      return { success: true };
    }

    return { success: false };
  }

  async renameChatSession(sessionId: string, newName: string): Promise<{ success: boolean }> {
    await this.delay();

    const session = this.mockSessions.find((s) => s.sessionId === sessionId);
    if (session) {
      session.title = newName;
      session.updatedAt = new Date();
      return { success: true };
    }

    return { success: false };
  }

  // ==================== Bridge 관련 메서드들 ====================

  async registerBridge(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }> {
    await this.delay();

    this.mockBridges.set(id, config);
    if (!this.currentBridgeId) {
      this.currentBridgeId = id;
    }

    return { success: true };
  }

  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    await this.delay();

    const success = this.mockBridges.delete(id);
    if (this.currentBridgeId === id) {
      const remainingIds = Array.from(this.mockBridges.keys());
      this.currentBridgeId = remainingIds.length > 0 ? remainingIds[0] : undefined;
    }

    return { success };
  }

  async switchBridge(id: string): Promise<{ success: boolean }> {
    await this.delay();

    if (this.mockBridges.has(id)) {
      this.currentBridgeId = id;
      return { success: true };
    }

    return { success: false };
  }

  async getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null> {
    await this.delay();

    if (!this.currentBridgeId) {
      return null;
    }

    const config = this.mockBridges.get(this.currentBridgeId);
    return config ? { id: this.currentBridgeId, config } : null;
  }

  async getBridgeIds(): Promise<string[]> {
    await this.delay();
    return Array.from(this.mockBridges.keys());
  }

  async getBridgeConfig(id: string): Promise<LlmBridgeConfig | null> {
    await this.delay();
    return this.mockBridges.get(id) || null;
  }

  // ==================== MCP 관련 메서드들 ====================

  async getAllMcp(): Promise<McpConfig[]> {
    await this.delay();
    return [...this.mockMcpConfigs];
  }

  async connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    await this.delay();

    // 기존 설정이 있으면 업데이트, 없으면 추가
    const existingIndex = this.mockMcpConfigs.findIndex((c) => c.name === config.name);
    if (existingIndex !== -1) {
      this.mockMcpConfigs[existingIndex] = config;
    } else {
      this.mockMcpConfigs.push(config);
    }

    return { success: true };
  }

  async disconnectMcp(name: string): Promise<{ success: boolean }> {
    await this.delay();

    const index = this.mockMcpConfigs.findIndex((c) => c.name === name);
    if (index !== -1) {
      this.mockMcpConfigs.splice(index, 1);
      return { success: true };
    }

    return { success: false };
  }

  async executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolArgs
  ): Promise<ToolExecutionResponse> {
    await this.delay();

    return {
      success: true,
      result: `Mock execution result for ${toolName} on ${clientName}`,
    };
  }

  async getMcpResources(clientName: string): Promise<ResourceListResponse> {
    await this.delay();

    return {
      resources: [
        {
          uri: `mock://resource1`,
          name: 'Mock Resource 1',
          description: 'A mock resource for testing',
          mimeType: 'text/plain',
        },
      ],
    };
  }

  async readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    await this.delay();

    return {
      uri,
      mimeType: 'text/plain',
      content: `Mock content for resource: ${uri}`,
    };
  }

  async getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    await this.delay();

    return {
      connected: true,
    };
  }

  // ==================== Preset 관련 메서드들 ====================

  async getAllPresets(): Promise<Preset[]> {
    await this.delay();
    return [...this.mockPresets];
  }

  async createPreset(preset: Preset): Promise<{ success: boolean }> {
    await this.delay();

    this.mockPresets.push({
      ...preset,
      id: preset.id || `preset-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  }

  async updatePreset(preset: Preset): Promise<{ success: boolean }> {
    await this.delay();

    const index = this.mockPresets.findIndex((p) => p.id === preset.id);
    if (index !== -1) {
      this.mockPresets[index] = {
        ...preset,
        updatedAt: new Date(),
      };
      return { success: true };
    }

    return { success: false };
  }

  async deletePreset(id: string): Promise<{ success: boolean }> {
    await this.delay();

    const index = this.mockPresets.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.mockPresets.splice(index, 1);
      return { success: true };
    }

    return { success: false };
  }

  async getPreset(id: string): Promise<Preset | null> {
    await this.delay();

    return this.mockPresets.find((p) => p.id === id) || null;
  }
}
