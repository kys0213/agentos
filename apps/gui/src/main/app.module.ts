import { Module } from '@nestjs/common';
import { AgentSessionModule } from './agent/session/agent-session.module';
import { ElectronAppModule } from './electron/electron-app.module';
import { OutboundChannel } from './common/event/outbound-channel';

@Module({
  imports: [AgentSessionModule, ElectronAppModule],
  providers: [OutboundChannel],
})
export class AppModule {}
