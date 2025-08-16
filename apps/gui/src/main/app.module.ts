import { Module } from '@nestjs/common';
import { AgentController } from './agent/agent.controller';

@Module({
  imports: [],
  controllers: [AgentController],
  providers: [],
})
export class AppModule {}
