import { UserMessage, LlmBridge, MultiModalContent } from 'llm-bridge-spec';
import {
  ChatManager,
  McpRegistry,
  Preset,
  FileAgentMetadataRepository,
  SimpleAgent,
} from '@agentos/core';
import * as path from 'path';
import * as os from 'os';
import { createUserInputStream } from './utils/user-input-stream';

export async function interactiveChat(manager: ChatManager, llmBridge: LlmBridge) {
  // Prepare minimal file-based metadata repository under temp app data
  const baseDir = path.join(os.homedir(), '.agentos-cli');
  const repo = new FileAgentMetadataRepository(path.join(baseDir, 'agents'));

  // Construct a single SimpleAgent with provided bridge/manager/repo
  const agent = new SimpleAgent('cli-agent', llmBridge, new McpRegistry(), manager, repo);

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
  await repo.create({
    name: 'CLI Agent',
    description: 'Interactive CLI agent',
    icon: '💻',
    keywords: ['cli', 'interactive'],
    preset,
    status: 'active',
  });

  console.log('Type your message. Enter "quit" to exit. Use "history" to view messages.');

  const builder = createUserInputStream({ prompt: 'You: ' })
    .on(/^history$/i, async () => {
      const session = await manager.load({ sessionId: 'default', agentId: 'cli-agent' });
      const { items } = await session.getHistories();
      for (const msg of items) {
        let first: MultiModalContent | undefined;
        if (Array.isArray(msg.content)) {
          first = msg.content[0];
        } else if (typeof msg.content === 'object' && msg.content && 'contentType' in msg.content) {
          first = msg.content as MultiModalContent;
        } else {
          first = undefined;
        }
        const text = first?.contentType === 'text' ? first.value : '[non-text]';
        console.log(`${msg.role}: ${text}`);
      }
    })
    .on(/^(.+)$/s, async (match) => {
      const input = match[1];
      const userMessage: UserMessage = {
        role: 'user',
        content: [{ contentType: 'text', value: input }],
      };
      const { messages } = await agent.chat([userMessage]);
      const assistantMessage = messages[messages.length - 1];
      let first: MultiModalContent | undefined;
      if (Array.isArray(assistantMessage.content)) {
        first = assistantMessage.content[0];
      } else if (
        typeof assistantMessage.content === 'object' &&
        assistantMessage.content &&
        'contentType' in assistantMessage.content
      ) {
        first = assistantMessage.content as MultiModalContent;
      } else {
        first = undefined;
      }
      const text = first?.contentType === 'text' ? first.value : '[non-text]';
      console.log('Assistant:', text);
    });

  const stream = builder.build();
  await stream.run();

  const session = await manager.load({ sessionId: 'default', agentId: 'cli-agent' });
  await session.commit();
}
