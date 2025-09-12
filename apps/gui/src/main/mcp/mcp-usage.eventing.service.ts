import { McpUsageService as CoreMcpUsageService } from '@agentos/core';
import type { McpUsageRepository } from '@agentos/core';
import { OutboundChannel } from '../common/event/outbound-channel';

/**
 * Extends core McpUsageService to emit GUI outbound events on usage updates.
 * Emits: 'mcp.usage.stats.updated' after each recordEnd, carrying latest stats payload.
 */
export class McpUsageEventingService extends CoreMcpUsageService {
  constructor(repo: McpUsageRepository, private readonly outbound: OutboundChannel) {
    super(repo);
  }

  async recordEnd(
    id: string,
    result: { status: 'success' | 'error'; durationMs: number; errorCode?: string }
  ): Promise<void> {
    await super.recordEnd(id, result);
    // After persisting, compute fresh stats and emit
    try {
      const stats = await this.getStats();
      this.outbound.emit({ type: 'mcp.usage.stats.updated', payload: stats });
    } catch (e) {
      // best-effort; do not throw to caller
      // eslint-disable-next-line no-console
      console.warn('Failed to emit mcp usage stats update:', e);
    }
  }
}

