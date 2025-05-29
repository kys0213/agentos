import { CompressStrategy, CompressionResult, MessageHistory } from '@agentos/core';
import { ChatMessage } from 'llm-bridge-spec';

/**
 * A simple compressor that does nothing and returns a placeholder summary.
 */
export class NoopCompressor implements CompressStrategy {
  async compress(messages: MessageHistory[]): Promise<CompressionResult> {
    const summary: ChatMessage = {
      role: 'system',
      content: { contentType: 'text', value: 'summary not implemented' },
    };

    return {
      summary,
      compressedCount: messages.length,
    };
  }
}

