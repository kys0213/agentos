import { McpUsageLog, McpUsageStats } from '@agentos/core';
import type { IpcChannel } from '../../shared/types/ipc-channel';
import type { McpUsageLogProtocol } from '../../shared/types/mcp-usage-log-protocol';
import {
  UsageLogQueryOptions,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
  McpUsageUpdateEvent,
} from '../../shared/types/mcp-usage-types';

export class McpUsageLogService implements McpUsageLogProtocol {
  constructor(private ipcChannel: IpcChannel) {}

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
  subscribeToUsageUpdates(callback: (event: McpUsageUpdateEvent) => void): Promise<() => void> {
    return this.ipcChannel.subscribeToUsageUpdates(callback);
  }
}
