import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CursorPagination, McpUsageService } from '@agentos/core';
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
  async getUsageLogs(@Payload() _data: GetLogsDto) {
    const query = toCoreQuery(_data?.query);
    const pg = toCorePagination(_data?.pg);
    return this.usage.list(query, pg);
  }

  @EventPattern('mcp.usage.getStats')
  async getUsageStats(@Payload() _dto?: GetStatsDto) {
    const query = toCoreQuery(_dto?.query);
    return this.usage.getStats(query);
  }

  // TODO cache 레이어 추가
  @EventPattern('mcp.usage.getHourlyStats')
  async getHourlyStats(@Payload() data: HourlyStatsDto) {
    const base = new Date(data.date);
    const start = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0, 0)
    );
    const end = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 23, 59, 59, 999)
    );

    const buckets = new Array<number>(24).fill(0);
    // Pull all logs in range (paginate)
    let cursor = '';
    // Limit per page to avoid huge memory; adequate for dev/local usage
    const limit = 500;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await this.usage.list(
        { from: start, to: end },
        {
          cursor,
          limit,
          direction: 'forward',
        }
      );

      for (const l of page.items) {
        const hour = new Date(l.timestamp).getUTCHours();
        buckets[hour]++;
      }

      if (!page.hasMore || !page.nextCursor) {
        break;
      }

      cursor = page.nextCursor;
    }

    const hourlyData: Array<[number, number]> = buckets.map((c, h) => [h, c]);

    return { hourlyData };
  }

  @EventPattern('mcp.usage.getLogsInRange')
  async getLogsInRange(@Payload() _data: LogsInRangeDto) {
    return [] as unknown[]; // TODO: optional
  }

  @EventPattern('mcp.usage.clear')
  async clear(@Payload() _dto?: ClearDto) {
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
}):
  | {
      toolId?: string;
      toolName?: string;
      agentId?: string;
      sessionId?: string;
      status?: 'success' | 'error';
      from?: Date;
      to?: Date;
    }
  | undefined {
  if (!q) {
    return;
  }

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
}): CursorPagination | undefined {
  if (!pg) {
    return;
  }
  return {
    cursor: pg.cursor ?? '',
    limit: pg.limit ?? 20,
    direction: pg.direction ?? 'forward',
  };
}
