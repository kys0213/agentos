import { Message, UserMessage, LlmBridge } from 'llm-bridge-spec';
import { ChatManager, SimpleAgent, SimpleAgentManager, McpRegistry } from '@agentos/core';
import { createUserInputStream } from './utils/user-input-stream';

export async function interactiveChat(manager: ChatManager, llmBridge: LlmBridge) {
  // Agent 생성
  const agent = new SimpleAgent(
    llmBridge,
    new McpRegistry(),
    manager,
    {
      id: 'cli-agent',
      name: 'CLI Agent',
      description: 'Interactive CLI agent',
      icon: '💻',
      keywords: ['cli', 'interactive'],
    },
    {
      id: 'cli-preset',
      name: 'CLI Preset',
      description: 'Default CLI preset',
      author: 'System',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      systemPrompt: 'You are a helpful assistant.',
      llmBridgeName: 'default',
      llmBridgeConfig: {},
    }
  );

  // Agent Manager 생성 및 Agent 등록
  const agentManager = new SimpleAgentManager();
  await agentManager.register(agent);

  console.log('Type your message. Enter "quit" to exit. Use "history" to view messages.');

  const builder = createUserInputStream({ prompt: 'You: ' })
    .on(/^history$/i, async () => {
      const session = await manager.getSession('default');
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
      const messages = await agentManager.execute('cli-agent', [userMessage]);
      const assistantMessage = messages[messages.length - 1];
      const text =
        !Array.isArray(assistantMessage.content) && assistantMessage.content.contentType === 'text'
          ? assistantMessage.content.value
          : '[non-text]';
      console.log('Assistant:', text);
    });

  const stream = builder.build();
  await stream.run();

  const session = await manager.getSession('default');
  await session.commit();
}
