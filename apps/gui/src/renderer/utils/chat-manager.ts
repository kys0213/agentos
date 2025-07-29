import {
  ChatManager,
  FileBasedChatManager,
  FileBasedSessionStorage,
  CompressStrategy,
  CompressionResult,
} from '@agentos/core';

export function createChatManager(): ChatManager {
  // GUI에서는 메모리 기반 또는 IPC를 통한 구현이 필요할 수 있음
  // 임시로 기본 구현을 제공
  const baseDir = '.agent/sessions';
  const storage = new FileBasedSessionStorage(baseDir);
  
  // 기본 압축 전략 (압축하지 않음)
  const noCompression: CompressStrategy = {
    compress: async (messages): Promise<CompressionResult> => ({
      summary: { role: 'system', content: { contentType: 'text', value: 'No compression applied' } },
      compressedCount: 0,
      discardedMessages: [],
    }),
  };
  
  return new FileBasedChatManager(storage, noCompression, noCompression);
}