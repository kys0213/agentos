import type { RpcClient } from '../../../shared/rpc/transport';
import type { McpUsageLog, McpUsageStats } from '@agentos/core';
import {
  UsageLogQueryOptions,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
  McpUsageUpdateEvent,
  McpUsageUpdateEventSchema,
} from '../../../shared/types/mcp-usage-types';

export class McpUsageRpcService {
  constructor(private readonly transport: RpcClient) {}

  async getUsageLogs(clientName?: string, _options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    // Map to core shape: { query, pg }
    const payload = clientName ? { query: { toolName: clientName } } : {};

    const res = await this.transport.request<McpUsageLog[]>('mcp.usage.getLogs', payload);

    return res;
  }

  async getAllUsageLogs(_options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    const res = await this.transport.request<McpUsageLog[]>('mcp.usage.getLogs', {});
    return res;
  }

  getUsageStats(clientName?: string): Promise<McpUsageStats> {
    const payload = clientName ? { query: { toolName: clientName } } : {};
    return this.transport.request<McpUsageStats>('mcp.usage.getStats', payload);
  }

  getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse> {
    return this.transport.request<HourlyStatsResponse>('mcp.usage.getHourlyStats', {
      date: date.toISOString(),
      clientName,
    });
  }

  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]> {
    return this.transport.request<McpUsageLog[]>('mcp.usage.getLogsInRange', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      clientName,
    });
  }

  clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return this.transport.request<ClearUsageLogsResponse>(
      'mcp.usage.clear',
      olderThan ? { olderThan: olderThan.toISOString() } : {}
    );
  }
  setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse> {
    return this.transport.request<SetUsageTrackingResponse>('mcpUsageLog:set-usage-tracking', {
      clientName,
      enabled,
    });
  }
  async subscribeToUsageUpdates(
    callback: (event: McpUsageUpdateEvent) => void
  ): Promise<() => void> {
    if (!this.transport.stream) {
      return async () => {};
    }

    const close = this.transport.on<McpUsageUpdateEvent>('mcp.usage.events', (ev) => {
      const { success } = McpUsageUpdateEventSchema.safeParse(ev);

      if (success) {
        callback(ev);
      }
    });

    return close;
  }
}
