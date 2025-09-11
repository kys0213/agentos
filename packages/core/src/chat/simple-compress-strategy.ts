import { CompressStrategy, CompressionResult, MessageHistory } from './chat-session';
import { ChatMessage } from 'llm-bridge-spec';

/**
 * Simple compression strategy that creates a summary of messages
 */
export class SimpleCompressStrategy implements CompressStrategy {
  async compress(messages: MessageHistory[]): Promise<CompressionResult> {
    if (messages.length === 0) {
      throw new Error('No messages to compress');
    }

    // 간단한 요약 생성 (실제 구현에서는 LLM을 사용할 수 있음)
    const summary: ChatMessage = {
      role: 'assistant',
      content: [
        {
          contentType: 'text',
          value: `Summary of ${messages.length} messages from ${messages[0].createdAt.toISOString()} to ${
            messages[messages.length - 1].createdAt.toISOString()
          }`,
        },
      ],
    };

    return {
      summary,
      compressedCount: messages.length,
      discardedMessages: messages.map((m) => m.messageId),
    };
  }
}