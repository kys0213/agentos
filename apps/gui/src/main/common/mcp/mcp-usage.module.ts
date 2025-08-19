import { Module } from '@nestjs/common';
import { InMemoryUsageTracker } from '@agentos/core';
import { MCP_USAGE_TRACKER_TOKEN } from './constants';

@Module({
  providers: [
    {
      provide: MCP_USAGE_TRACKER_TOKEN,
      useFactory: () => new InMemoryUsageTracker(),
    },
  ],
  exports: [MCP_USAGE_TRACKER_TOKEN],
})
export class McpUsageModule {}
