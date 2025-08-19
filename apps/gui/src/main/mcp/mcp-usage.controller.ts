import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { McpRegistry } from '@agentos/core';
import {
  ClearDto,
  GetLogsDto,
  GetStatsDto,
  HourlyStatsDto,
  LogsInRangeDto,
} from './dto/mcp-usage.dto';
import { OutboundChannel } from '../common/event/outbound-channel';
import { map } from 'rxjs';

@Controller()
export class McpUsageController {
  constructor(
    private readonly registry: McpRegistry,
    private readonly outbound: OutboundChannel
  ) {}

  @EventPattern('mcp.usage.getLogs')
  async getUsageLogs(@Payload() data: GetLogsDto) {
    const { clientName, options } = data || {};
    const clients = clientName
      ? [await this.registry.get(clientName)]
      : await this.registry.getAll();

    // Usage tracking has moved out of Mcp protocol; return empty for now.
    const _usable = (await Promise.all(clients)).filter(Boolean);
    const logs: any[] = [];
    return logs;
  }

  @EventPattern('mcp.usage.getStats')
  async getUsageStats(@Payload() dto?: GetStatsDto) {
    const clientName = dto?.clientName;
    if (clientName) {
      const client = await this.registry.get(clientName);
      if (!client) throw new Error(`MCP client not found: ${clientName}`);
      // Usage stats are not available from protocol client; return stub
      return {
        totalUsage: 0,
        successRate: 0,
        averageDuration: 0,
        lastUsedAt: undefined,
        errorCount: 0,
      };
    }
    return {
      totalUsage: 0,
      successRate: 0,
      averageDuration: 0,
      lastUsedAt: undefined,
      errorCount: 0,
    };
  }

  @EventPattern('mcp.usage.getHourlyStats')
  async getHourlyStats(@Payload() data: HourlyStatsDto) {
    const targetDate = new Date(data.date);
    const hourlyData: Array<[number, number]> = Array.from({ length: 24 }, (_, h) => [h, 0]);
    const addLogs = (logs: any[]) => {
      logs
        .filter((log) => {
          const d = log.timestamp;
          return (
            d.getFullYear() === targetDate.getFullYear() &&
            d.getMonth() === targetDate.getMonth() &&
            d.getDate() === targetDate.getDate()
          );
        })
        .forEach((log) => {
          const hour = log.timestamp.getHours();
          hourlyData[hour][1]++;
        });
    };
    if (data.clientName) {
      const client = await this.registry.get(data.clientName);
      if (!client) throw new Error(`MCP client not found: ${data.clientName}`);
      // No usage logs available; nothing to aggregate
      // addLogs(client.getUsageLogs());
    } else {
      const clients = await this.registry.getAll();
      // clients.forEach((c) => addLogs(c.getUsageLogs()));
    }
    return { hourlyData };
  }

  @EventPattern('mcp.usage.getLogsInRange')
  async getLogsInRange(@Payload() data: LogsInRangeDto) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const clients = data.clientName
      ? [await this.registry.get(data.clientName)]
      : await this.registry.getAll();
    const _usable = (await Promise.all(clients)).filter(Boolean) as any[];
    return [];
  }

  @EventPattern('mcp.usage.clear')
  async clear(@Payload() dto?: ClearDto) {
    const _clients = await this.registry.getAll();
    // Stub: call client.clearLogs when available
    return { success: true };
  }

  // Stream outbound usage events via OutboundChannel
  @EventPattern('mcp.usage.events')
  events() {
    return this.outbound.ofType('mcp.usage.').pipe(map((ev) => ev));
  }
}
