import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AgentSessionModule } from './agent/agent.module';
import { ElectronAppModule } from './electron/electron-app.module';
import { PresetApiModule } from './preset/preset.module';
import { McpUsageModule } from './common/mcp/mcp-usage.module';
import { McpRegistryModule } from './common/mcp/mcp-registry.module';
import { McpApiModule } from './mcp/mcp.api.module';
import { McpUsageApiModule } from './mcp/mcp-usage.api.module';
import { BridgeApiModule } from './bridge/bridge.api.module';
import { OutboundChannelModule } from './common/event/outbound-channel.module';
import { ChatModule } from './chat/chat.module';
import { KnowledgeApiModule } from './knowledge/knowledge.api.module';

@Module({
  imports: [
    AgentSessionModule,
    ElectronAppModule,
    PresetApiModule,
    McpRegistryModule,
    McpUsageModule,
    OutboundChannelModule,
    McpApiModule,
    McpUsageApiModule,
    BridgeApiModule,
    ChatModule,
    KnowledgeApiModule,
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
})
export class AppModule {}
