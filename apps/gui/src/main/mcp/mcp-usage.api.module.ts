import { Module } from '@nestjs/common';
import { McpUsageController } from './mcp-usage.controller';
import { McpRegistryModule } from '../common/mcp/mcp-registry.module';

@Module({
  imports: [McpRegistryModule],
  controllers: [McpUsageController],
})
export class McpUsageApiModule {}

