import path from 'node:path';
import { ChatManager, FileBasedChatManager, FileBasedSessionStorage } from '@agentos/core';
import { NoopCompressor } from './noop-compressor';

export interface ChatManagerFactory {
  create(): ChatManager;
}

export const createManager: ChatManagerFactory['create'] = () => {
  const baseDir = path.join(process.cwd(), '.agent', 'sessions');
  const storage = new FileBasedSessionStorage(baseDir);
  const compressor = new NoopCompressor();
  return new FileBasedChatManager(storage, compressor, compressor);
};
