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
        let first: MultiModalContent | undefined;
        if (Array.isArray(m.content)) {
          first = m.content[0];
        } else if (typeof m.content === 'object' && m.content && 'contentType' in m.content) {
          first = m.content as MultiModalContent;
        }
        return first?.contentType === 'text'
          ? `${m.role}: ${first.value}`
          : `${m.role}: [non-text]`;
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
