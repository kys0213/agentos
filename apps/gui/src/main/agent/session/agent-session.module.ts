import { Module } from '@nestjs/common';
import { AgentSessionService } from './agent-session.service';
import { AgentSessionController } from './agent-session.controller';
import { McpRegistryModule } from '../../common/mcp/mcp-registry.module';
import { AgentCoreModule } from '../../common/agent/agent-core.module';

@Module({
  imports: [McpRegistryModule, AgentCoreModule],
  controllers: [AgentSessionController],
  providers: [AgentSessionService],
  exports: [AgentSessionService],
})
export class AgentSessionModule {}
