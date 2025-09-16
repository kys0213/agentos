import { Module } from '@nestjs/common';
import { McpUsageController } from './mcp-usage.controller';
import { McpRegistryModule } from '../common/mcp/mcp-registry.module';
import { OutboundChannelModule } from '../common/event/outbound-channel.module';

@Module({
  imports: [McpRegistryModule, OutboundChannelModule],
  controllers: [McpUsageController],
})
export class McpUsageApiModule {}
