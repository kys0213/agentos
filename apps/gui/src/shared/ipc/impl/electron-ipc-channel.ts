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
import type { IpcChannel } from '../../types/ipc-channel';
import type { CursorPagination, CursorPaginationResult } from '@agentos/core';
import type { ChatSessionDescription } from '@agentos/core';
import type { MessageHistory } from '@agentos/core';
import type {
  ResourceListResponse,
  ResourceResponse,
  ToolExecutionResponse,
} from '../../types/ipc-channel';
import { LlmManifest, UserMessage } from 'llm-bridge-spec';
import type {
  ClearUsageLogsResponse,
  HourlyStatsResponse,
  McpUsageUpdateEvent,
  SetUsageTrackingResponse,
  UsageLogQueryOptions,
} from '../../types/mcp-usage-types';

export class ElectronIpcChannel implements IpcChannel {
  private get electronAPI() {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('ElectronAPI is not available. Ensure Electron preload exposed it.');
    }
    return window.electronAPI;
  }

  // Agent
  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    return this.electronAPI.agent.chat(agentId, messages, options);
  }
  async endSession(agentId: string, sessionId: string): Promise<void> {
    return this.electronAPI.agent.endSession(agentId, sessionId);
  }
  async getAgentMetadata(id: string): Promise<AgentMetadata | null> {
    return this.electronAPI.agent.getAgentMetadata(id);
  }
  async getAllAgentMetadatas(): Promise<AgentMetadata[]> {
    return this.electronAPI.agent.getAllAgentMetadatas();
  }
  async updateAgent(
    agentId: string,
    agent: Partial<Omit<AgentMetadata, 'id'>>
  ): Promise<AgentMetadata> {
    return this.electronAPI.agent.updateAgent(agentId, agent);
  }
  async createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata> {
    return this.electronAPI.agent.createAgent(agent);
  }
  async deleteAgent(id: string): Promise<AgentMetadata> {
    return this.electronAPI.agent.deleteAgent(id);
  }

  // BuiltinTool
  async getAllBuiltinTools(): Promise<BuiltinTool[]> {
    return this.electronAPI.builtinTool.getAllBuiltinTools();
  }
  async getBuiltinTool(id: string): Promise<BuiltinTool | null> {
    return this.electronAPI.builtinTool.getBuiltinTool(id);
  }
  async invokeBuiltinTool<R>(toolName: string, args: Record<string, any>): Promise<R> {
    return this.electronAPI.builtinTool.invokeBuiltinTool(toolName, args);
  }

  // Bridge
  async registerBridge(config: LlmManifest): Promise<{ success: boolean }> {
    return this.electronAPI.bridge.registerBridge(config);
  }
  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    return this.electronAPI.bridge.unregisterBridge(id);
  }
  async switchBridge(id: string): Promise<{ success: boolean }> {
    return this.electronAPI.bridge.switchBridge(id);
  }
  async getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null> {
    return this.electronAPI.bridge.getCurrentBridge();
  }
  async getBridgeIds(): Promise<string[]> {
    return this.electronAPI.bridge.getBridgeIds();
  }
  async getBridgeConfig(id: string): Promise<LlmManifest | null> {
    return this.electronAPI.bridge.getBridgeConfig(id);
  }

  // MCP
  async getAllMcp(): Promise<McpConfig[]> {
    return this.electronAPI.mcp.getAllMcp();
  }
  async connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    return this.electronAPI.mcp.connectMcp(config);
  }
  async disconnectMcp(name: string): Promise<{ success: boolean }> {
    return this.electronAPI.mcp.disconnectMcp(name);
  }
  async executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolMetadata
  ): Promise<ToolExecutionResponse> {
    return this.electronAPI.mcp.executeMcpTool(clientName, toolName, args);
  }
  async getMcpResources(clientName: string): Promise<ResourceListResponse> {
    return this.electronAPI.mcp.getMcpResources(clientName);
  }
  async readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.electronAPI.mcp.readMcpResource(clientName, uri);
  }
  async getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.electronAPI.mcp.getMcpStatus(clientName);
  }
  async getToolMetadata(clientName: string): Promise<McpToolMetadata> {
    return this.electronAPI.mcp.getToolMetadata(clientName);
  }
  async getAllToolMetadata(): Promise<McpToolMetadata[]> {
    return this.electronAPI.mcp.getAllToolMetadata();
  }

  // MCP Usage Log
  async getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.electronAPI.mcpUsageLog.getUsageLogs(clientName, options);
  }
  async getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.electronAPI.mcpUsageLog.getAllUsageLogs(options);
  }
  async getUsageStats(clientName?: string): Promise<McpUsageStats> {
    return this.electronAPI.mcpUsageLog.getUsageStats(clientName);
  }
  async getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse> {
    return this.electronAPI.mcpUsageLog.getHourlyStats(date, clientName);
  }
  async getUsageLogsInRange(
    startDate: Date,
    endDate: Date,
    clientName?: string
  ): Promise<McpUsageLog[]> {
    return this.electronAPI.mcpUsageLog.getUsageLogsInRange(startDate, endDate, clientName);
  }
  async clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return this.electronAPI.mcpUsageLog.clearUsageLogs(olderThan);
  }
  async setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse> {
    return this.electronAPI.mcpUsageLog.setUsageTracking(clientName, enabled);
  }
  async subscribeToUsageUpdates(
    callback: (event: McpUsageUpdateEvent) => void
  ): Promise<() => void> {
    await this.electronAPI.mcpUsageLog.subscribeToUsageUpdates(callback);
    const { ipcRenderer } = (window as any).require('electron');
    const handler = (_e: any, ev: McpUsageUpdateEvent) => callback(ev);
    ipcRenderer.on('mcp:usage-update', handler);
    return () => ipcRenderer.removeListener('mcp:usage-update', handler);
  }

  // Preset
  async getAllPresets(): Promise<Preset[]> {
    return this.electronAPI.preset.getAllPresets();
  }
  async createPreset(preset: CreatePreset): Promise<Preset> {
    return this.electronAPI.preset.createPreset(preset);
  }
  async updatePreset(id: string, preset: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    return this.electronAPI.preset.updatePreset(id, preset);
  }
  async deletePreset(id: string): Promise<Preset> {
    return this.electronAPI.preset.deletePreset(id);
  }
  async getPreset(id: string): Promise<Preset | null> {
    return this.electronAPI.preset.getPreset(id);
  }

  // Conversation
  async listSessions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<ChatSessionDescription>> {
    return this.electronAPI.conversation.listSessions(pagination);
  }
  async getMessages(
    sessionId: string,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>> {
    return this.electronAPI.conversation.getMessages(sessionId, pagination);
  }
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    return this.electronAPI.conversation.deleteSession(sessionId);
  }
}
