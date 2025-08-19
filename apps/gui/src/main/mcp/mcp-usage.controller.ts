import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { McpService } from '@agentos/core';
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
    private readonly mcp: McpService,
    private readonly outbound: OutboundChannel
  ) {}

  @EventPattern('mcp.usage.getLogs')
  async getUsageLogs(@Payload() data: GetLogsDto) {
    // 현재 코어 서비스는 세밀한 로그를 보관하지 않으므로 빈 배열 반환
    return [] as unknown[];
  }

  @EventPattern('mcp.usage.getStats')
  async getUsageStats(@Payload() dto?: GetStatsDto) {
    const tools = this.mcp.getAllTools().items;
    const totalUsage = tools.reduce((sum, t) => sum + (t.usageCount ?? 0), 0);
    const lastUsedTimes = tools
      .map((t) => t.lastUsedAt?.getTime())
      .filter((n): n is number => typeof n === 'number');
    const lastUsedAt = lastUsedTimes.length > 0 ? new Date(Math.max(...lastUsedTimes)) : undefined;
    return { totalUsage, successRate: 0, averageDuration: 0, lastUsedAt, errorCount: 0 };
  }

  @EventPattern('mcp.usage.getHourlyStats')
  async getHourlyStats(@Payload() data: HourlyStatsDto) {
    const hourlyData: Array<[number, number]> = Array.from({ length: 24 }, (_, h) => [h, 0]);
    return { hourlyData };
  }

  @EventPattern('mcp.usage.getLogsInRange')
  async getLogsInRange(@Payload() data: LogsInRangeDto) {
    return [] as unknown[];
  }

  @EventPattern('mcp.usage.clear')
  async clear(@Payload() dto?: ClearDto) {
    // Stub: call client.clearLogs when available
    return { success: true };
  }

  // Stream outbound usage events via OutboundChannel
  @EventPattern('mcp.usage.events')
  events() {
    return this.outbound.ofType('mcp.usage.').pipe(map((ev) => ev));
  }
}
