import { Module } from '@nestjs/common';
import { McpRegistry } from '@agentos/core';
import { McpUsagePublisher } from '../../mcp/mcp-usage.publisher';

@Module({
  providers: [McpRegistry, McpUsagePublisher],
  exports: [McpRegistry],
})
export class McpRegistryModule {}
