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
import type { IpcChannel } from '../../../shared/types/ipc-channel';
import type { ResourceListResponse, ResourceResponse, ToolExecutionResponse } from '../../types/core-types';
import { LlmManifest, UserMessage } from 'llm-bridge-spec';
import type {
  ClearUsageLogsResponse,
  HourlyStatsResponse,
  McpUsageUpdateEvent,
  SetUsageTrackingResponse,
  UsageLogQueryOptions,
} from '../../../shared/types/mcp-usage-types';

export class MockIpcChannel implements IpcChannel {
  private bridges = new Map<string, LlmManifest>();
  private currentBridgeId: string | null = null;

  // Agent
  async chat(_agentId: string, _messages: UserMessage[], _options?: AgentExecuteOptions): Promise<AgentChatResult> {
    return { messages: [], sessionId: `session_${Date.now()}` };
  }
  async endSession(_agentId: string, _sessionId: string): Promise<void> { return; }
  async getAgentMetadata(_id: string): Promise<AgentMetadata | null> { return null; }
  async getAllAgentMetadatas(): Promise<AgentMetadata[]> { return []; }
  async updateAgent(_agentId: string, agent: Partial<Omit<AgentMetadata, 'id'>>): Promise<AgentMetadata> {
    return {
      id: 'mock-agent',
      name: agent.name ?? 'Mock Agent',
      description: agent.description ?? '',
      icon: agent.icon ?? '🤖',
      keywords: [],
      preset: {
        id: 'mock-preset',
        name: 'Mock Preset',
        description: '',
        author: 'mock',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        systemPrompt: '',
        enabledMcps: [],
        llmBridgeName: 'mock',
        llmBridgeConfig: {},
        status: 'active',
        usageCount: 0,
        knowledgeDocuments: 0,
        knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
        category: [],
      },
      status: 'active',
      lastUsed: new Date(),
      sessionCount: 0,
      usageCount: 0,
    };
  }
  async createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata> {
    return await this.updateAgent('mock', agent);
  }
  async deleteAgent(_id: string): Promise<AgentMetadata> { return await this.updateAgent('mock', {}); }

  // BuiltinTool
  async getAllBuiltinTools(): Promise<BuiltinTool[]> { return []; }
  async getBuiltinTool(_id: string): Promise<BuiltinTool | null> { return null; }
  async invokeBuiltinTool<R>(_toolName: string, _args: Record<string, any>): Promise<R> { return {} as R; }

  // Bridge
  async registerBridge(config: LlmManifest): Promise<{ success: boolean }> {
    const id = (config as any).name ?? `bridge_${this.bridges.size + 1}`;
    this.bridges.set(id, config);
    if (!this.currentBridgeId) this.currentBridgeId = id;
    return { success: true };
  }
  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    const ok = this.bridges.delete(id);
    if (this.currentBridgeId === id) this.currentBridgeId = this.bridges.keys().next().value ?? null;
    return { success: ok };
  }
  async switchBridge(id: string): Promise<{ success: boolean }> { this.currentBridgeId = id; return { success: true }; }
  async getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null> {
    if (!this.currentBridgeId) return null;
    const cfg = this.bridges.get(this.currentBridgeId);
    if (!cfg) return null;
    return { id: this.currentBridgeId, config: cfg };
  }
  async getBridgeIds(): Promise<string[]> { return Array.from(this.bridges.keys()); }
  async getBridgeConfig(id: string): Promise<LlmManifest | null> { return this.bridges.get(id) ?? null; }

  // MCP
  async getAllMcp(): Promise<McpConfig[]> { return []; }
  async connectMcp(_config: McpConfig): Promise<{ success: boolean }> { return { success: true }; }
  async disconnectMcp(_name: string): Promise<{ success: boolean }> { return { success: true }; }
  async executeMcpTool(_client: string, _tool: string, _args: McpToolMetadata): Promise<ToolExecutionResponse> {
    return { success: true, result: {} };
  }
  async getMcpResources(_client: string): Promise<ResourceListResponse> { return { resources: [] }; }
  async readMcpResource(_client: string, uri: string): Promise<ResourceResponse> {
    return { uri, content: '', mimeType: 'text/plain' };
  }
  async getMcpStatus(_client: string): Promise<{ connected: boolean; error?: string }> { return { connected: false }; }
  async getToolMetadata(_client: string): Promise<McpToolMetadata> { return { id: 'mock', name: 'Mock', description: '', version: '1.0.0', provider: 'mock', usageCount: 0, permissions: [] } as any; }
  async getAllToolMetadata(): Promise<McpToolMetadata[]> { return []; }

  // Preset
  async getAllPresets(): Promise<Preset[]> { return []; }
  async createPreset(preset: CreatePreset): Promise<Preset> { return { id: 'mock', ...preset } as Preset; }
  async updatePreset(id: string, preset: Partial<Omit<Preset, 'id'>>): Promise<Preset> { return { id, ...(preset as any) } as Preset; }
  async deletePreset(id: string): Promise<Preset> { return { id, name: 'deleted', description: '', author: '', createdAt: new Date(), updatedAt: new Date(), version: '1.0.0', systemPrompt: '', enabledMcps: [], llmBridgeName: 'mock', llmBridgeConfig: {}, status: 'active', usageCount: 0, knowledgeDocuments: 0, knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 }, category: [] } as any; }
  async getPreset(_id: string): Promise<Preset | null> { return null; }

  // Usage Log
  async getUsageLogs(_clientName: string, _options?: UsageLogQueryOptions): Promise<McpUsageLog[]> { return []; }
  async getAllUsageLogs(_options?: UsageLogQueryOptions): Promise<McpUsageLog[]> { return []; }
  async getUsageStats(_clientName?: string): Promise<McpUsageStats> {
    return { totalUsage: 0, successRate: 0, averageDuration: 0, lastUsedAt: undefined, errorCount: 0 } as any;
  }
  async getHourlyStats(_date: Date, _clientName?: string): Promise<HourlyStatsResponse> { return { hourlyData: Array.from({ length: 24 }, (_, h) => [h, 0]) }; }
  async getUsageLogsInRange(_start: Date, _end: Date, _clientName?: string): Promise<McpUsageLog[]> { return []; }
  async clearUsageLogs(_olderThan?: Date): Promise<ClearUsageLogsResponse> { return { success: true, clearedCount: 0 }; }
  async setUsageTracking(_clientName: string, _enabled: boolean): Promise<SetUsageTrackingResponse> { return { success: true }; }
  async subscribeToUsageUpdates(_callback: (event: McpUsageUpdateEvent) => void): Promise<() => void> { return () => {}; }
}

