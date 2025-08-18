import { UserMessage, LlmBridge } from 'llm-bridge-spec';
import {
  ChatManager,
  McpRegistry,
  Preset,
  SimpleAgentService,
  FileAgentMetadataRepository,
  LlmBridgeRegistry,
} from '@agentos/core';
import * as path from 'path';
import * as os from 'os';
import { createUserInputStream } from './utils/user-input-stream';

export async function interactiveChat(manager: ChatManager, llmBridge: LlmBridge) {
  // Prepare minimal file-based metadata repository under temp app data
  const baseDir = path.join(os.homedir(), '.agentos-cli');
  const repo = new FileAgentMetadataRepository(path.join(baseDir, 'agents'));

  // Minimal LlmBridgeRegistry that returns provided llmBridge by name
  class CliBridgeRegistry implements LlmBridgeRegistry {
    async listSummaries() {
      return [];
    }
    async getManifest() {
      return null;
    }
    async getBridge() {
      return null;
    }
    async getBridgeOrThrow() {
      throw new Error('not implemented');
    }
    async getBridgeByName(name: string) {
      // single bridge environment: return provided bridge for any name
      return llmBridge;
    }
    async loadBridge() {
      throw new Error('not implemented');
    }
    async register() {
      throw new Error('not implemented');
    }
    async unregister() {
      throw new Error('not implemented');
    }
    async getActiveId() {
      return null;
    }
    async setActiveId() {
      /* no-op */
    }
  }
  const llmRegistry = new CliBridgeRegistry();
  const agentService = new SimpleAgentService(llmRegistry, new McpRegistry(), manager, repo);

  const preset: Preset = {
    id: 'cli-preset',
    name: 'CLI Preset',
    description: 'Default CLI preset',
    author: 'System',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: 'You are a helpful assistant.',
    enabledMcps: [],
    llmBridgeName: 'default',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: {
      indexed: 0,
      vectorized: 0,
      totalSize: 0,
    },
    category: ['general'],
  };

  // Ensure initial agent metadata exists
  await agentService.createAgent({
    id: 'cli-agent',
    name: 'CLI Agent',
    description: 'Interactive CLI agent',
    icon: '💻',
    keywords: ['cli', 'interactive'],
    preset,
    status: 'active',
  } as any);

  console.log('Type your message. Enter "quit" to exit. Use "history" to view messages.');

  const builder = createUserInputStream({ prompt: 'You: ' })
    .on(/^history$/i, async () => {
      const session = await manager.load({ sessionId: 'default', agentId: 'cli-agent' });
      const { items } = await session.getHistories();
      for (const msg of items) {
        const text =
          !Array.isArray(msg.content) && msg.content.contentType === 'text'
            ? msg.content.value
            : '[non-text]';
        console.log(`${msg.role}: ${text}`);
      }
    })
    .on(/^(.+)$/s, async (match) => {
      const input = match[1];
      const userMessage: UserMessage = {
        role: 'user',
        content: { contentType: 'text', value: input },
      };
      const { messages } = await agentService.execute('cli-agent', [userMessage]);
      const assistantMessage = messages[messages.length - 1];
      const text =
        !Array.isArray(assistantMessage.content) && assistantMessage.content.contentType === 'text'
          ? assistantMessage.content.value
          : '[non-text]';
      console.log('Assistant:', text);
    });

  const stream = builder.build();
  await stream.run();

  const session = await manager.load({ sessionId: 'default', agentId: 'cli-agent' });
  await session.commit();
}
