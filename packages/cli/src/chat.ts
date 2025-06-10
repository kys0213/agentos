import { Message } from 'llm-bridge-spec';
import { ChatManager } from '@agentos/core';
import { createManager } from './chat-manager';
import { createUserInputStream } from './utils/user-input-stream';

export async function interactiveChat() {
  const manager: ChatManager = createManager();
  const session = await manager.create();

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
      const userMessage: Message = {
        role: 'user',
        content: { contentType: 'text', value: input },
      };
      await session.appendMessage(userMessage);

      const assistantMessage: Message = {
        role: 'assistant',
        content: { contentType: 'text', value: `Echo: ${input}` },
      };
      await session.appendMessage(assistantMessage);
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
