import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { McpUsageService } from '@agentos/core';
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
    private readonly usage: McpUsageService,
    private readonly outbound: OutboundChannel
  ) {}

  @EventPattern('mcp.usage.getLogs')
  async getUsageLogs(@Payload() data: GetLogsDto) {
    const query = toCoreQuery(data?.query);
    const pg = toCorePagination(data?.pg);
    return this.usage.list(query, pg);
  }

  @EventPattern('mcp.usage.getStats')
  async getUsageStats(@Payload() dto?: GetStatsDto) {
    const query = toCoreQuery(dto?.query);
    return this.usage.getStats(query);
  }

  @EventPattern('mcp.usage.getHourlyStats')
  async getHourlyStats(@Payload() data: HourlyStatsDto) {
    const hourlyData: Array<[number, number]> = Array.from({ length: 24 }, (_, h) => [h, 0]);
    return { hourlyData };
  }

  @EventPattern('mcp.usage.getLogsInRange')
  async getLogsInRange(@Payload() data: LogsInRangeDto) {
    return [] as unknown[]; // TODO: optional
  }

  @EventPattern('mcp.usage.clear')
  async clear(@Payload() dto?: ClearDto) {
    // TODO: optional clear support
    return { success: true };
  }

  // Stream outbound usage events via OutboundChannel
  @EventPattern('mcp.usage.events')
  events() {
    return this.outbound.ofType('mcp.usage.').pipe(map((ev) => ev));
  }
}

// ---------- helpers ----------
function toCoreQuery(q?: {
  toolId?: string;
  toolName?: string;
  agentId?: string;
  sessionId?: string;
  status?: 'success' | 'error';
  from?: string;
  to?: string;
}) {
  if (!q) return undefined;
  return {
    ...q,
    from: q.from ? new Date(q.from) : undefined,
    to: q.to ? new Date(q.to) : undefined,
  };
}

function toCorePagination(pg?: {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}) {
  if (!pg) return undefined as any;
  return {
    cursor: pg.cursor ?? '',
    limit: pg.limit ?? 20,
    direction: pg.direction ?? 'forward',
  } as any;
}
