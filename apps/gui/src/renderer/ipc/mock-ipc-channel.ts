import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  BuiltinTool,
  CreateAgentMetadata,
  CreatePreset,
  McpConfig,
  McpToolMetadata,
  McpUsageLog,
  McpUsageStats,
  Preset,
} from '@agentos/core';
import type { IpcChannel } from '../../shared/types/ipc-channel';
import type {
  CursorPagination,
  CursorPaginationResult,
  ChatSessionDescription,
} from '@agentos/core';
import type { MessageHistory } from '@agentos/core';
import type {
  ResourceListResponse,
  ResourceResponse,
  ToolExecutionResponse,
} from '../../shared/types/ipc-channel';
import { LlmManifest, UserMessage, Message } from 'llm-bridge-spec';
import type {
  ClearUsageLogsResponse,
  HourlyStatsResponse,
  McpUsageUpdateEvent,
  SetUsageTrackingResponse,
  UsageLogQueryOptions,
} from '../../shared/types/mcp-usage-types';

export class MockIpcChannel implements IpcChannel {
  bridges = new Map<string, LlmManifest>();
  currentBridgeId: string | null = null;
  mcpConfigs: McpConfig[] = [];
  mcpConnected = new Set<string>();
  toolMetadataByClient = new Map<string, McpToolMetadata[]>();
  usageLogs: McpUsageLog[] = [];
  presets: Preset[] = [];
  agents: AgentMetadata[] = [];
  sessions: Map<string, { title: string; updatedAt: Date; messages: MessageHistory[] }> = new Map();

  // Agent
  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    // Simple echo behavior for mock
    const sessionId = options?.sessionId ?? `session_${Date.now()}`;
    const text = messages
      .map((m) => {
        const c = m.content;
        if (typeof c === 'string') {
          return c;
        }

        if (Array.isArray(c)) {
          return c
            .map((it) =>
              typeof it === 'string' ? it : ((it as any)?.value ?? (it as any)?.text ?? '')
            )
            .join('\n');
        }

        if (c && typeof c === 'object') {
          return (c as { value?: unknown }).value ?? JSON.stringify(c);
        }
        return '';
      })
      .join('\n');

    // Return content using MultiModalContent shape expected by GUI
    const reply = {
      role: 'assistant',
      content: [{ contentType: 'text', value: `Echo: ${text}` }],
    } as unknown as Message;
    return { messages: [reply], sessionId };
  }
  async endSession(_agentId: string, _sessionId: string): Promise<void> {
    return;
  }
  async getAgentMetadata(id: string): Promise<AgentMetadata | null> {
    return this.agents.find((a) => a.id === id) ?? null;
  }
  async getAllAgentMetadatas(): Promise<AgentMetadata[]> {
    return [...this.agents];
  }
  async updateAgent(
    agentId: string,
    patch: Partial<Omit<AgentMetadata, 'id'>>
  ): Promise<AgentMetadata> {
    const idx = this.agents.findIndex((a) => a.id === agentId);
    if (idx === -1) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    const updated = { ...this.agents[idx], ...patch, id: agentId } as AgentMetadata;
    this.agents[idx] = updated;
    return updated;
  }
  async createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata> {
    const id = `agent_${Date.now()}`;
    const created = {
      id,
      name: agent.name,
      description: agent.description ?? '',
      icon: agent.icon ?? '🤖',
      keywords: agent.keywords ?? [],
      preset: agent.preset,
      status: 'active',
      lastUsed: undefined,
      sessionCount: 0,
      usageCount: 0,
    } as AgentMetadata;
    this.agents.push(created);
    return created;
  }
  async deleteAgent(id: string): Promise<AgentMetadata> {
    const found = await this.getAgentMetadata(id);
    if (!found) {
      throw new Error(`Agent not found: ${id}`);
    }
    this.agents = this.agents.filter((a) => a.id !== id);
    return found;
  }

  // BuiltinTool
  async getAllBuiltinTools(): Promise<BuiltinTool[]> {
    return [];
  }
  async getBuiltinTool(_id: string): Promise<BuiltinTool | null> {
    return null;
  }
  async invokeBuiltinTool<R>(_toolName: string, _args: Record<string, unknown>): Promise<R> {
    return {} as R;
  }

  // Bridge
  async registerBridge(config: LlmManifest): Promise<{ success: boolean }> {
    const id = (config as { name?: string }).name ?? `bridge_${this.bridges.size + 1}`;
    this.bridges.set(id, config);
    if (!this.currentBridgeId) {
      this.currentBridgeId = id;
    }
    return { success: true };
  }
  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    const ok = this.bridges.delete(id);
    if (this.currentBridgeId === id) {
      this.currentBridgeId = this.bridges.keys().next().value ?? null;
    }
    return { success: ok };
  }
  async switchBridge(id: string): Promise<{ success: boolean }> {
    this.currentBridgeId = id;
    return { success: true };
  }
  async getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null> {
    if (!this.currentBridgeId) {
      return null;
    }
    const cfg = this.bridges.get(this.currentBridgeId);
    if (!cfg) {
      return null;
    }
    return { id: this.currentBridgeId, config: cfg };
  }
  async getBridgeIds(): Promise<string[]> {
    return Array.from(this.bridges.keys());
  }
  async getBridgeConfig(id: string): Promise<LlmManifest | null> {
    return this.bridges.get(id) ?? null;
  }

  // MCP
  async getAllMcp(): Promise<McpConfig[]> {
    return [...this.mcpConfigs];
  }
  async connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    const existing = this.mcpConfigs.find((c) => c.name === config.name);
    if (!existing) {
      this.mcpConfigs.push(config);
    }
    this.mcpConnected.add(config.name);
    return { success: true };
  }
  async disconnectMcp(name: string): Promise<{ success: boolean }> {
    this.mcpConnected.delete(name);
    return { success: true };
  }
  async executeMcpTool(
    client: string,
    tool: string,
    args: McpToolMetadata
  ): Promise<ToolExecutionResponse> {
    // Record usage log
    const log: McpUsageLog = {
      id: `log_${Date.now()}`,
      toolId: tool,
      toolName: tool,
      agentId: 'mock-agent',
      agentName: 'Mock Agent',
      action: 'invoke',
      status: 'success',
      duration: Math.floor(Math.random() * 200) + 10,
      timestamp: new Date(),
      parameters: args,
      result: 'ok',
    };
    this.usageLogs.push(log);
    return { success: true, result: { echoedArgs: args } };
  }
  async getMcpResources(_client: string): Promise<ResourceListResponse> {
    return { resources: [] };
  }
  async readMcpResource(_client: string, uri: string): Promise<ResourceResponse> {
    return { uri, content: '', mimeType: 'text/plain' };
  }
  async getMcpStatus(client: string): Promise<{ connected: boolean; error?: string }> {
    return { connected: this.mcpConnected.has(client) };
  }
  async getToolMetadata(client: string): Promise<McpToolMetadata> {
    const list = this.toolMetadataByClient.get(client) ?? [];
    return (
      list[0] ?? {
        id: 'mock',
        name: 'Mock Tool',
        description: '',
        version: '1.0.0',
        provider: 'mock',
        usageCount: 0,
        permissions: [],
      }
    );
  }
  async getAllToolMetadata(): Promise<McpToolMetadata[]> {
    return Array.from(this.toolMetadataByClient.values()).flat();
  }

  // Preset
  async getAllPresets(): Promise<Preset[]> {
    return [...this.presets];
  }
  async createPreset(preset: CreatePreset): Promise<Preset> {
    const created: Preset = { id: `preset_${Date.now()}`, ...preset } as Preset;
    this.presets.push(created);
    return created;
  }
  async updatePreset(id: string, preset: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const idx = this.presets.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Preset not found: ${id}`);
    }
    const updated = { ...this.presets[idx], ...preset, id } as Preset;
    this.presets[idx] = updated;
    return updated;
  }
  async deletePreset(id: string): Promise<Preset> {
    const found = this.presets.find((p) => p.id === id);
    if (!found) {
      throw new Error(`Preset not found: ${id}`);
    }
    this.presets = this.presets.filter((p) => p.id !== id);
    return found;
  }
  async getPreset(id: string): Promise<Preset | null> {
    return this.presets.find((p) => p.id === id) ?? null;
  }

  // Conversation
  async listSessions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<ChatSessionDescription>> {
    const items: ChatSessionDescription[] = Array.from(this.sessions.entries())
      .map(([id, s]) => ({ id, title: s.title, updatedAt: s.updatedAt }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const idx = pagination?.cursor ? items.findIndex((i) => i.id === pagination.cursor) : -1;
    const limit = pagination?.limit ?? items.length;
    let startIndex = 0;
    if (idx >= 0) {
      if (pagination?.direction === 'backward') {
        startIndex = Math.max(0, idx - limit);
      } else {
        startIndex = idx + 1;
      }
    }
    const paged = items.slice(startIndex, startIndex + limit);
    return { items: paged, nextCursor: paged.at(-1)?.id ?? '', hasMore: false };
  }
  async getMessages(
    sessionId: string,
    _pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>> {
    const s = this.sessions.get(sessionId);
    return {
      items: (s?.messages ?? []) as Readonly<MessageHistory>[],
      nextCursor: '',
      hasMore: false,
    };
  }
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    this.sessions.delete(sessionId);
    return { success: true };
  }

  // Usage Log
  async getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    let logs = [...this.usageLogs];
    if (options?.status) {
      logs = logs.filter((l) => l.status === options.status);
    }
    if (options?.agentId) {
      logs = logs.filter((l) => l.agentId === options.agentId);
    }
    if (options?.sortOrder === 'asc') {
      logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } else {
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      logs = logs.slice(offset, offset + limit);
    }
    return logs;
  }
  async getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.getUsageLogs('*', options).then(() => {
      let all = [...this.usageLogs];
      if (options?.status) {
        all = all.filter((l) => l.status === options.status);
      }
      if (options?.agentId) {
        all = all.filter((l) => l.agentId === options.agentId);
      }
      if (options?.sortOrder === 'asc') {
        all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      } else {
        all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0;
        const limit = options.limit || 50;
        all = all.slice(offset, offset + limit);
      }
      return all;
    });
  }
  async getUsageStats(_clientName?: string): Promise<McpUsageStats> {
    return {
      totalUsage: 0,
      successRate: 0,
      averageDuration: 0,
      lastUsedAt: undefined,
      errorCount: 0,
    };
  }
  async getHourlyStats(_date: Date, _clientName?: string): Promise<HourlyStatsResponse> {
    return { hourlyData: Array.from({ length: 24 }, (_, h) => [h, 0]) };
  }
  async getUsageLogsInRange(
    _start: Date,
    _end: Date,
    _clientName?: string
  ): Promise<McpUsageLog[]> {
    return [];
  }
  async clearUsageLogs(_olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return { success: true, clearedCount: 0 };
  }
  async setUsageTracking(
    _clientName: string,
    _enabled: boolean
  ): Promise<SetUsageTrackingResponse> {
    return { success: true };
  }
  async subscribeToUsageUpdates(
    _callback: (event: McpUsageUpdateEvent) => void
  ): Promise<() => void> {
    return () => {};
  }
}

// Test utilities to seed mock data in dev/test
export const MockIpcUtils = {
  addBridge(channel: MockIpcChannel, cfg: LlmManifest) {
    return channel.registerBridge(cfg);
  },

  async addPreset(channel: MockIpcChannel, preset: Preset) {
    // expose through public API
    return channel.createPreset(preset);
  },

  async seedMcpClient(channel: MockIpcChannel, config: McpConfig, tools?: McpToolMetadata[]) {
    await channel.connectMcp(config);
    if (tools && tools.length) {
      channel.toolMetadataByClient?.set(config.name, tools);
    }
  },
  async addUsageLog(channel: MockIpcChannel, log: McpUsageLog) {
    channel.usageLogs?.push(log);
  },
  clear(channel: MockIpcChannel) {
    channel.mcpConfigs = [];
    channel.mcpConnected = new Set();
    channel.toolMetadataByClient = new Map();
    channel.usageLogs = [];
    channel.presets = [];
    channel.agents = [];
  },
};
