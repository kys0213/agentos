import { LlmBridge, LlmBridgePrompt, LlmBridgeResponse, LlmMetadata } from 'llm-bridge-spec';

export default class ReverseBridge implements LlmBridge {
  async invoke(prompt: LlmBridgePrompt): Promise<LlmBridgeResponse> {
    const last = prompt.messages[prompt.messages.length - 1];
    const content = last
      ? Array.isArray(last.content)
        ? last.content[0]
        : last.content
      : undefined;
    const text = content && content.contentType === 'text' ? String(content.value) : '';
    const reversed = [...String(text)].reverse().join('');
    return {
      content: { contentType: 'text', value: reversed },
    };
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Reverse Bridge',
      version: '1.0.0',
      description: 'Reverse text bridge',
      model: 'reverse',
      contextWindow: 0,
      maxTokens: 0,
    };
  }
}
