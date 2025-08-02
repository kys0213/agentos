export default class EchoBridge {
  async invoke(prompt) {
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
  async getMetadata() {
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
