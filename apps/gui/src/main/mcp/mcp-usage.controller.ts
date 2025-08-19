import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { McpRegistry } from '@agentos/core';
import { ClearDto, GetLogsDto, GetStatsDto, HourlyStatsDto, LogsInRangeDto } from './dto/mcp-usage.dto';

@Controller()
export class McpUsageController {
  constructor(private readonly registry: McpRegistry) {}

  @EventPattern('mcp.usage.getLogs')
  async getUsageLogs(@Payload() data: GetLogsDto) {
    const { clientName, options } = data || {};
    const clients = clientName ? [await this.registry.get(clientName)] : await this.registry.getAll();
    const usable = (await Promise.all(clients)).filter(Boolean) as any[];
    let logs = usable.flatMap((c) => c.getUsageLogs());
    if (options?.status) logs = logs.filter((l) => l.status === options.status);
    if (options?.agentId) logs = logs.filter((l) => l.agentId === options.agentId);
    if (options?.sortOrder === 'asc') logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    else logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset ?? 0;
      const limit = options.limit ?? 50;
      logs = logs.slice(offset, offset + limit);
    }
    return logs;
  }

  @EventPattern('mcp.usage.getStats')
  async getUsageStats(@Payload() dto?: GetStatsDto) {
    const clientName = dto?.clientName;
    if (clientName) {
      const client = await this.registry.get(clientName);
      if (!client) throw new Error(`MCP client not found: ${clientName}`);
      return client.getUsageStats();
    }
    const clients = await this.registry.getAll();
    const allStats = clients.map((c) => c.getUsageStats());
    const totalUsage = allStats.reduce((sum, s) => sum + s.totalUsage, 0);
    const totalErrors = allStats.reduce((sum, s) => sum + s.errorCount, 0);
    const totalDuration = allStats.reduce((sum, s) => sum + s.averageDuration * s.totalUsage, 0);
    const lastTimes = allStats.map((s) => s.lastUsedAt).filter(Boolean).map((d) => d!.getTime());
    return {
      totalUsage,
      successRate: totalUsage > 0 ? (totalUsage - totalErrors) / totalUsage : 0,
      averageDuration: totalUsage > 0 ? totalDuration / totalUsage : 0,
      lastUsedAt: lastTimes.length > 0 ? new Date(Math.max(...lastTimes)) : undefined,
      errorCount: totalErrors,
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
      addLogs(client.getUsageLogs());
    } else {
      const clients = await this.registry.getAll();
      clients.forEach((c) => addLogs(c.getUsageLogs()));
    }
    return { hourlyData };
  }

  @EventPattern('mcp.usage.getLogsInRange')
  async getLogsInRange(@Payload() data: LogsInRangeDto) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const clients = data.clientName ? [await this.registry.get(data.clientName)] : await this.registry.getAll();
    const usable = (await Promise.all(clients)).filter(Boolean) as any[];
    return usable
      .flatMap((c) => c.getUsageLogs())
      .filter((log) => {
        const t = log.timestamp.getTime();
        return t >= start.getTime() && t <= end.getTime();
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  @EventPattern('mcp.usage.clear')
  async clear(@Payload() dto?: ClearDto) {
    const _clients = await this.registry.getAll();
    // Stub: call client.clearLogs when available
    return { success: true };
  }
}
