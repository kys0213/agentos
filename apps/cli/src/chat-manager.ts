import path from 'node:path';
import {
  ChatManager,
  FileBasedChatManager,
  FileBasedSessionStorage,
  CompressStrategy,
} from '@agentos/core';
import { LlmBridge } from 'llm-bridge-spec';
import { LlmCompressor } from './llm-compressor';

export interface ChatManagerFactory {
  create(llmBridge: LlmBridge): ChatManager;
}

export const createManager: ChatManagerFactory['create'] = (llmBridge) => {
  const baseDir = path.join(process.cwd(), '.agent', 'sessions');
  const storage = new FileBasedSessionStorage(baseDir);
  const compressor: CompressStrategy = new LlmCompressor(llmBridge);
  return new FileBasedChatManager(storage, compressor, compressor);
};
