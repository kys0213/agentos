import { LlmBridge, UserMessage, MultiModalContent } from 'llm-bridge-spec';
import { CompressStrategy, CompressionResult, MessageHistory } from '@agentos/core';

/**
 * Compressor that summarizes messages using a provided LLM bridge.
 */
export class LlmCompressor implements CompressStrategy {
  constructor(private readonly bridge: LlmBridge) {}

  async compress(messages: MessageHistory[]): Promise<CompressionResult> {
    const text = messages
      .map((m) => {
        const first = Array.isArray(m.content)
          ? m.content[0]
          : (m.content as unknown as MultiModalContent);
        if (first && first.contentType === 'text') {
          return `${m.role}: ${first.value}`;
        }
        return `${m.role}: [non-text]`;
      })
      .join('\n');

    const prompt: UserMessage = {
      role: 'user',
      content: [{ contentType: 'text', value: `Summarize the following conversation:\n${text}` }],
    };

    const response = await this.bridge.invoke({ messages: [prompt] });

    return {
      summary: { role: 'system', content: [response.content] },
      compressedCount: messages.length,
    };
  }
}
