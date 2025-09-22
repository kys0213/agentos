import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { McpRegistry } from '@agentos/core';
import { OutboundChannel } from '../common/event/outbound-channel';

@Injectable()
export class McpUsagePublisher implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private lastCounts = new Map<string, number>();

  constructor(
    private readonly registry: McpRegistry,
    private readonly outbound: OutboundChannel
  ) {}

  async onModuleInit() {
    this.timer = setInterval(() => this.scan(), 2000);
    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }
  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async scan(): Promise<void> {
    // Usage tracking removed from protocol client; publisher is a no-op for now.
    return;
  }
}
