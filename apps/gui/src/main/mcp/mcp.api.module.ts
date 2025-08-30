import { Module } from '@nestjs/common';
// import { McpController } from './mcp.controller';
import { GeneratedMcpController } from './gen/mcp.controller.gen.new';
import { McpRegistryModule } from '../common/mcp/mcp-registry.module';

@Module({
  imports: [McpRegistryModule],
  controllers: [GeneratedMcpController],
})
export class McpApiModule {}
