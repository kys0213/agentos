import type { RpcTransport } from '../../../shared/rpc/transport';
import type { McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  UsageLogQueryOptions,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
  McpUsageUpdateEvent,
} from '../../../shared/types/mcp-usage-types';

export class McpUsageRpcService {
  constructor(private readonly transport: RpcTransport) {}

  getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.transport.request('mcpUsageLog:get-usage-logs', { clientName, options });
  }
  getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.transport.request('mcpUsageLog:get-all-usage-logs', options);
  }
  getUsageStats(clientName?: string): Promise<McpUsageStats> {
    return this.transport.request('mcpUsageLog:get-usage-stats', clientName);
  }
  getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse> {
    return this.transport.request('mcpUsageLog:get-hourly-stats', { date, clientName });
  }
  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]> {
    return this.transport.request('mcpUsageLog:get-usage-logs-in-range', {
      startDate,
      endDate,
      clientName,
    });
  }
  clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return this.transport.request('mcpUsageLog:clear-usage-logs', olderThan);
  }
  setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse> {
    return this.transport.request('mcpUsageLog:set-usage-tracking', { clientName, enabled });
  }
  async subscribeToUsageUpdates(
    callback: (event: McpUsageUpdateEvent) => void
  ): Promise<() => void> {
    await this.transport.request('mcpUsageLog:subscribe-usage-updates');
    // Events are published on 'mcp:usage-update'
    if (!this.transport.stream) throw new Error('Transport does not support event streams');
    return this.transport.stream('mcp:usage-update', callback as any);
  }
}
