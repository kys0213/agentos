import { Module } from '@nestjs/common';
import { AgentSessionService } from './agent.service';
import { AgentSessionController } from './agent.controller';
import { McpRegistryModule } from '../common/mcp/mcp-registry.module';
import { AgentCoreModule } from '../common/agent/agent-core.module';
import { AgentEventBridge } from './events/agent-event-bridge';

@Module({
  imports: [McpRegistryModule, AgentCoreModule],
  controllers: [AgentSessionController],
  providers: [AgentSessionService, AgentEventBridge],
  exports: [AgentSessionService],
})
export class AgentSessionModule {}
