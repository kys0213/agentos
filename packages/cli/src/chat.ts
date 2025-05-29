import readline from 'node:readline/promises';
import path from 'node:path';
import {
  FileBasedChatManager,
  FileBasedSessionStorage,
  ChatSessionDescription,
} from '@agentos/core';
import { NoopCompressor } from './noop-compressor';
import { Message } from 'llm-bridge-spec';

function createManager(): FileBasedChatManager {
  const baseDir = path.join(process.cwd(), '.agent', 'sessions');
  const storage = new FileBasedSessionStorage(baseDir);
  const compressor = new NoopCompressor();
  return new FileBasedChatManager(storage, compressor, compressor);
}

export async function interactiveChat(): Promise<void> {
  const manager = createManager();
  const session = await manager.create();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('Type your message. Enter "exit" to quit.');

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

    const response = `Echo: ${input}`;
    const assistantMessage: Message = {
      role: 'assistant',
      content: { contentType: 'text', value: response },
    };
    await session.appendMessage(assistantMessage);
    console.log('Assistant:', response);
    await session.commit();
  }

  await session.commit();
  rl.close();
}

export async function listSessions(): Promise<void> {
  const manager = createManager();
  const { items } = await manager.list();

  if (items.length === 0) {
    console.log('No chat sessions found.');
    return;
  }

  items.forEach((item: ChatSessionDescription) => {
    console.log(`${item.id}\t${item.title}\t${item.updatedAt.toISOString()}`);
  });
}

