import type { McpConfig, McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  ClearUsageLogsResponse,
  HourlyStatsResponse,
  McpUsageDashboard,
  McpUsageUpdateEvent,
  SetUsageTrackingResponse,
  UsageLogQueryOptions,
} from '../../shared/types/mcp-usage-types';
import type {
  ResourceListResponse,
  ResourceResponse,
  ToolExecutionResponse,
} from '../types/core-types';
import type { IpcChannel, McpProtocol } from '../../shared/types/ipc-channel';

/**
 * MCP 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class McpService implements McpProtocol {
  private usageUpdateSubscription?: () => void;
  private usageUpdateCallbacks: Set<(event: McpUsageUpdateEvent) => void> = new Set();

  constructor(private ipcChannel: IpcChannel) {}

  getAllMcp(): Promise<McpConfig[]> {
    return this.ipcChannel.getAllMcp();
  }
  connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    return this.ipcChannel.connectMcp(config);
  }
  disconnectMcp(name: string): Promise<{ success: boolean }> {
    return this.ipcChannel.disconnectMcp(name);
  }
  executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolMetadata
  ): Promise<ToolExecutionResponse> {
    return this.ipcChannel.executeMcpTool(clientName, toolName, args);
  }
  getMcpResources(clientName: string): Promise<ResourceListResponse> {
    return this.ipcChannel.getMcpResources(clientName);
  }
  readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.ipcChannel.readMcpResource(clientName, uri);
  }
  getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.ipcChannel.getMcpStatus(clientName);
  }

  async getToolMetadata(clientName: string): Promise<McpToolMetadata> {
    return this.ipcChannel.getToolMetadata(clientName);
  }

  async getAllToolMetadata(): Promise<McpToolMetadata[]> {
    return this.ipcChannel.getAllToolMetadata();
  }

  /**
   * 리소스 정리
   */
  dispose() {
    if (this.usageUpdateSubscription) {
      this.usageUpdateSubscription();
      this.usageUpdateSubscription = undefined;
    }
    this.usageUpdateCallbacks.clear();
  }

  // Usage log methods were moved to McpUsageLogService in the new spec,
  // but provide pass-throughs here for compatibility.
  getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.ipcChannel.getUsageLogs(clientName, options);
  }
  getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.ipcChannel.getAllUsageLogs(options);
  }
  getUsageStats(clientName?: string): Promise<McpUsageStats> {
    return this.ipcChannel.getUsageStats(clientName);
  }
  getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse> {
    return this.ipcChannel.getHourlyStats(date, clientName);
  }
  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]> {
    return this.ipcChannel.getUsageLogsInRange(startDate, endDate, clientName);
  }
  clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return this.ipcChannel.clearUsageLogs(olderThan);
  }
  setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse> {
    return this.ipcChannel.setUsageTracking(clientName, enabled);
  }
}
