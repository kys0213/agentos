import type { ChatManager, LlmBridgeRegistry } from '@agentos/core';
import {
  FileAgentMetadataRepository,
  FileBasedChatManager,
  FileBasedSessionStorage,
  McpRegistry,
  SimpleAgentService,
} from '@agentos/core';
import { Module } from '@nestjs/common';
import * as path from 'path';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import { NoopCompressor } from '../../NoopCompressor';
import { McpRegistryModule } from '../mcp/mcp-registry.module';
import { LLM_BRIDGE_REGISTRY_TOKEN } from '../model/constants';
import { LlmBridgeModule } from '../model/llm-bridge.module';
import {
  AGENT_METADATA_REPOSITORY_TOKEN,
  AGENT_SERVICE_TOKEN,
  CHAT_MANAGER_TOKEN,
} from './constants';

@Module({
  imports: [McpRegistryModule, LlmBridgeModule],
  providers: [
    {
      provide: AGENT_METADATA_REPOSITORY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment) =>
        new FileAgentMetadataRepository(path.join(env.userDataPath, 'agents')),
    },
    // Provide ChatManager (file-based)
    {
      provide: CHAT_MANAGER_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment): ChatManager => {
        const sessionsDir = path.join(env.userDataPath, 'sessions');
        const storage = new FileBasedSessionStorage(sessionsDir);
        const compressor = new NoopCompressor();
        return new FileBasedChatManager(storage, compressor, compressor);
      },
    },

    {
      provide: AGENT_SERVICE_TOKEN,
      inject: [
        LLM_BRIDGE_REGISTRY_TOKEN,
        McpRegistry,
        CHAT_MANAGER_TOKEN,
        AGENT_METADATA_REPOSITORY_TOKEN,
      ],
      useFactory: (
        llmBridgeRegistry: LlmBridgeRegistry,
        mcpRegistry: McpRegistry,
        chatManager: ChatManager,
        repo: FileAgentMetadataRepository
      ) => new SimpleAgentService(llmBridgeRegistry, mcpRegistry, chatManager, repo),
    },
  ],
  exports: [AGENT_SERVICE_TOKEN, AGENT_METADATA_REPOSITORY_TOKEN],
})
export class AgentCoreModule {}
