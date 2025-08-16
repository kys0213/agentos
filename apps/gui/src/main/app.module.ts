import { Module } from '@nestjs/common';
import { AgentController } from './agent/agent.controller';
import { AgentSessionModule } from './agent/session/agent-session.module';

@Module({
  imports: [AgentSessionModule],
  controllers: [AgentController],
  providers: [],
})
export class AppModule {}
