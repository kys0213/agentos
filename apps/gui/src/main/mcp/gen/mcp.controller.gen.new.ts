// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';
import { McpService, McpUsageService, type CursorPagination } from '@agentos/core';
import { OutboundChannel } from '../../common/event/outbound-channel';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

@Controller()
export class GeneratedMcpController {
  constructor(
    private readonly mcp: McpService,
    private readonly usage: McpUsageService,
    private readonly outbound: OutboundChannel
  ) {}

  @EventPattern('mcp.getTool')
  async getTool(
    @Payload(new ZodValidationPipe(C.methods['getTool']['payload']))
    payload: z.input<(typeof C.methods)['getTool']['payload']>
  ): Promise<z.output<(typeof C.methods)['getTool']['response']>> {
    return this.mcp.getTool(payload.name);
  }

  @EventPattern('mcp.invokeTool')
  async invokeTool(
    @Payload(new ZodValidationPipe(C.methods['invokeTool']['payload']))
    payload: z.input<(typeof C.methods)['invokeTool']['payload']>
  ): Promise<z.output<(typeof C.methods)['invokeTool']['response']>> {
    try {
      const res = await this.mcp.executeTool(payload.name, payload.input, {
        agentId: payload.agentId,
        sessionId: payload.resumptionToken,
      });
      return { success: true, result: res };
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Tool invocation failed';
      return { success: false, error: msg };
    }
  }

  @EventPattern('mcp.usage.getLogs')
  async usage_getLogs(
    @Payload(new ZodValidationPipe(C.methods['usage.getLogs']['payload']))
    payload: z.input<(typeof C.methods)['usage.getLogs']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.getLogs']['response']>> {
    const pg = toCorePagination((payload as any)?.pg);
    const query = toCoreQuery((payload as any)?.query);
    const page = await this.usage.list(query, pg);
    return page.items as unknown as z.output<(typeof C.methods)['usage.getLogs']['response']>;
  }

  @EventPattern('mcp.usage.getStats')
  async usage_getStats(
    @Payload(new ZodValidationPipe(C.methods['usage.getStats']['payload']))
    payload: z.input<(typeof C.methods)['usage.getStats']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.getStats']['response']>> {
    const query = toCoreQuery((payload as any)?.query);
    return (await this.usage.getStats(query)) as unknown as z.output<
      (typeof C.methods)['usage.getStats']['response']
    >;
  }

  @EventPattern('mcp.usage.getHourlyStats')
  async usage_getHourlyStats(
    @Payload(new ZodValidationPipe(C.methods['usage.getHourlyStats']['payload']))
    payload: z.input<(typeof C.methods)['usage.getHourlyStats']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.getHourlyStats']['response']>> {
    const base = new Date((payload as any).date);
    const start = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0, 0)
    );
    const end = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 23, 59, 59, 999)
    );
    const buckets = new Array<number>(24).fill(0);
    let cursor = '';
    const limit = 500;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await this.usage.list(
        { from: start, to: end },
        { cursor, limit, direction: 'forward' }
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

  @EventPattern('mcp.usage.clear')
  async usage_clear(
    @Payload(new ZodValidationPipe(C.methods['usage.clear']['payload']))
    payload: z.input<(typeof C.methods)['usage.clear']['payload']>
  ): Promise<z.output<(typeof C.methods)['usage.clear']['response']>> {
    // Optional clear support placeholder
    return { success: true };
  }

  @EventPattern('mcp.usage.events')
  usage_events(): Observable<
    z.output<(typeof C.methods)['usage.events']['streamResponse']>
  > {
    return this.outbound
      .ofType('mcp.usage.')
      .pipe(map((ev) => ev as z.output<(typeof C.methods)['usage.events']['streamResponse']>));
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
