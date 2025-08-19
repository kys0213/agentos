import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AgentSessionModule } from './agent/session/agent-session.module';
import { ElectronAppModule } from './electron/electron-app.module';
import { OutboundChannel } from './common/event/outbound-channel';
import { PresetApiModule } from './preset/preset.module';
import { McpUsageModule } from './common/mcp/mcp-usage.module';
import { McpRegistryModule } from './common/mcp/mcp-registry.module';
import { McpUsageController } from './mcp/mcp-usage.controller';
import { OutboundChannelModule } from './common/event/outbound-channel.module';

@Module({
  imports: [
    AgentSessionModule,
    ElectronAppModule,
    PresetApiModule,
    McpRegistryModule,
    McpUsageModule,
    OutboundChannelModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    },
  ],
  controllers: [McpUsageController],
})
export class AppModule {}
