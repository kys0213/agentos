import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpRegistryModule } from '../common/mcp/mcp-registry.module';

@Module({
  imports: [McpRegistryModule],
  controllers: [McpController],
})
export class McpApiModule {}
