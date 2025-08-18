import {
  FileAgentMetadataRepository,
  SimpleAgentService,
  FileBasedChatManager,
  FileBasedSessionStorage,
} from '@agentos/core';
import type { ChatManager } from '@agentos/core';
import type { LlmBridgeRegistry, LlmBridge } from '@agentos/core';
import { Module } from '@nestjs/common';
import * as path from 'path';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import { McpRegistryModule } from '../mcp/mcp-registry.module';
import {
  AGENT_METADATA_REPOSITORY_TOKEN,
  AGENT_SERVICE_TOKEN,
} from './constants';
import { McpRegistry } from '@agentos/core';
import { NoopCompressor } from '../../NoopCompressor';
import { getBridgeManager } from '../../services/bridge-ipc-handlers';

@Module({
  imports: [McpRegistryModule],
  providers: [
    {
      provide: AGENT_METADATA_REPOSITORY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment) =>
        new FileAgentMetadataRepository(path.join(env.userDataPath, 'agents')),
    },
    // Provide ChatManager (file-based)
    {
      provide: 'CHAT_MANAGER',
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment): ChatManager => {
        const sessionsDir = path.join(env.userDataPath, 'sessions');
        const storage = new FileBasedSessionStorage(sessionsDir);
        const compressor = new NoopCompressor();
        return new FileBasedChatManager(storage, compressor, compressor);
      },
    },
    // Provide minimal LlmBridgeRegistry adapter backed by existing main BridgeManager
    {
      provide: 'LLM_BRIDGE_REGISTRY',
      useFactory: (): LlmBridgeRegistry => {
        class GuiBridgeRegistry implements LlmBridgeRegistry {
          async listSummaries() { throw new Error('not implemented'); }
          async getManifest() { return null; }
          async getBridge(id: string): Promise<LlmBridge | null> { return null; }
          async getBridgeOrThrow(id: string): Promise<LlmBridge> { throw new Error('not implemented'); }
          async getBridgeByName(name: string): Promise<LlmBridge | null> {
            const mgr = getBridgeManager();
            const cur = mgr?.getCurrentBridge();
            if (!cur) return null;
            // name here is llmBridgeName from preset; compare to current id or manifest name as available
            if (cur.id === name || cur.config.name === name) return cur.bridge as unknown as LlmBridge;
            return null;
          }
          async loadBridge() { throw new Error('not implemented'); }
          async register() { throw new Error('not implemented'); }
          async unregister() { throw new Error('not implemented'); }
          async getActiveId() { return null; }
          async setActiveId() { /* no-op */ }
        }
        return new GuiBridgeRegistry();
      },
    },
    {
      provide: AGENT_SERVICE_TOKEN,
      inject: [
        'LLM_BRIDGE_REGISTRY',
        McpRegistry,
        'CHAT_MANAGER',
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
