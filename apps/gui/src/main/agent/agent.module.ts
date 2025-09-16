import { Module } from '@nestjs/common';
import { AgentSessionService } from './agent.service';
// import { AgentSessionController } from './agent.controller';
import { GeneratedAgentController } from './gen/agent.controller.gen.new';
import { McpRegistryModule } from '../common/mcp/mcp-registry.module';
import { AgentCoreModule } from '../common/agent/agent-core.module';
import { AgentEventBridge } from './events/agent-event-bridge';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [McpRegistryModule, AgentCoreModule, ChatModule],
  controllers: [GeneratedAgentController],
  providers: [AgentSessionService, AgentEventBridge],
  exports: [AgentSessionService],
})
export class AgentSessionModule {}
