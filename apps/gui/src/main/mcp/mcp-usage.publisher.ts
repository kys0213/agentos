import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { McpRegistry } from '@agentos/core';
import { OutboundChannel } from '../common/event/outbound-channel';

@Injectable()
export class McpUsagePublisher implements OnModuleInit, OnModuleDestroy {
  private timer: any;
  private lastCounts = new Map<string, number>();

  constructor(private readonly registry: McpRegistry, private readonly outbound: OutboundChannel) {}

  async onModuleInit() {
    this.timer = setInterval(() => this.scan(), 2000);
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async scan() {
    try {
      const clients = await this.registry.getAll();
      for (const c of clients) {
        try {
          const meta = c.getMetadata();
          const prev = this.lastCounts.get(c.name) ?? 0;
          const curr = meta.usageCount ?? 0;
          if (curr > prev) {
            const logs = c.getUsageLogs().slice(-(curr - prev));
            logs.forEach((log) =>
              this.outbound.emit({
                type: 'mcp.usage.logged',
                payload: { clientName: c.name, newLog: log },
              })
            );
            this.lastCounts.set(c.name, curr);
          }
        } catch {
          // ignore client errors
        }
      }
    } catch {
      // ignore scan errors
    }
  }
}

