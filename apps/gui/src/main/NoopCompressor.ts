import { CompressStrategy, CompressionResult, MessageHistory } from '@agentos/core';

export class NoopCompressor implements CompressStrategy {
  async compress(messages: MessageHistory[]): Promise<CompressionResult> {
    return {
      summary: {
        role: 'system',
        content: [{ contentType: 'text', value: 'summary not implemented' }],
      },
      compressedCount: messages.length,
    };
  }
}
