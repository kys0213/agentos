import { Module } from '@nestjs/common';
import { AgentSessionService } from './agent-session.service';
import { AgentSessionController } from './agent-session.controller';

@Module({
  providers: [AgentSessionService],
  controllers: [AgentSessionController],
  exports: [AgentSessionService],
})
export class AgentSessionModule {}
