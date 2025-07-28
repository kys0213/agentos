import path from 'node:path';
import { FileBasedChatManager, FileBasedSessionStorage } from '@agentos/core';
import { NoopCompressor } from './NoopCompressor';
export function createChatManager() {
    const baseDir = path.join(process.cwd(), '.agent', 'sessions');
    const storage = new FileBasedSessionStorage(baseDir);
    const compressor = new NoopCompressor();
    return new FileBasedChatManager(storage, compressor, compressor);
}
