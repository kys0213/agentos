import { LlmBridge, LlmBridgePrompt, LlmBridgeResponse, LlmMetadata } from 'llm-bridge-spec';

export default class EchoBridge implements LlmBridge {
  async invoke(prompt: LlmBridgePrompt): Promise<LlmBridgeResponse> {
    const last = prompt.messages[prompt.messages.length - 1];
    const content = last
      ? Array.isArray(last.content)
        ? last.content[0]
        : last.content
      : undefined;
    const text = content && content.contentType === 'text' ? String(content.value) : '';
    return {
      content: { contentType: 'text', value: `Echo: ${text}` },
    };
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Echo Bridge',
      version: '1.0.0',
      description: 'Simple echo bridge',
      model: 'echo',
      contextWindow: 0,
      maxTokens: 0,
    };
  }
}
