import { Module } from '@nestjs/common';
import { AgentSessionModule } from './agent/session/agent-session.module';
import { ElectronAppModule } from './electron/electron-app.module';

@Module({
  imports: [AgentSessionModule, ElectronAppModule],
  providers: [],
})
export class AppModule {}
