import readline from 'node:readline/promises';
import { Message } from 'llm-bridge-spec';
import { ChatManager } from '@agentos/core';
import { createManager } from './chat-manager';

export async function interactiveChat() {
  const manager: ChatManager = createManager();
  const session = await manager.create();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('Type your message. Enter "exit" to quit.');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const input = await rl.question('You: ');
    if (input.trim().toLowerCase() === 'exit') {
      break;
    }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('Assistant:', (assistantMessage.content as any).value);
  }

  await session.commit();
  rl.close();
}
