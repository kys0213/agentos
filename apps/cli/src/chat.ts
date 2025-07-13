import { Message, UserMessage, LlmBridge } from 'llm-bridge-spec';
import { ChatManager, SimpleAgent, McpRegistry } from '@agentos/core';
import { createUserInputStream } from './utils/user-input-stream';

export async function interactiveChat(manager: ChatManager, llmBridge: LlmBridge) {
  const session = await manager.create();
  const agent = new SimpleAgent(llmBridge, session, new McpRegistry());

  console.log('Type your message. Enter "quit" to exit. Use "history" to view messages.');

  const builder = createUserInputStream({ prompt: 'You: ' })
    .on(/^history$/i, async () => {
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
      const messages = await agent.run([userMessage]);
      const assistantMessage = messages[messages.length - 1];
      const text =
        !Array.isArray(assistantMessage.content) && assistantMessage.content.contentType === 'text'
          ? assistantMessage.content.value
          : '[non-text]';
      console.log('Assistant:', text);
    });

  const stream = builder.build();
  await stream.run();

  await session.commit();
}
