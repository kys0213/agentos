import { BridgeManager } from '../BridgeManager';
import { LlmBridge, LlmBridgePrompt, LlmBridgeResponse, LlmMetadata } from 'llm-bridge-spec';

class DummyBridge implements LlmBridge {
  constructor(private readonly id: string) {}
  async invoke(_prompt: LlmBridgePrompt): Promise<LlmBridgeResponse> {
    return { content: { contentType: 'text', value: this.id } };
  }
  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: this.id,
      version: '1.0',
      description: '',
      model: '',
      contextWindow: 0,
      maxTokens: 0,
    };
  }
}

test('switchBridge changes active bridge', async () => {
  const manager = new BridgeManager();
  manager.register('a', new DummyBridge('a'));
  manager.register('b', new DummyBridge('b'));
  await manager.switchBridge('b');
  const result = await manager.getCurrentBridge().invoke({ messages: [] });
  if (result.content.contentType !== 'text') {
    throw new Error('Unexpected content type');
  }
  expect(result.content.value).toBe('b');
});

test('switching to unknown bridge throws', async () => {
  const manager = new BridgeManager();
  manager.register('a', new DummyBridge('a'));
  await expect(manager.switchBridge('x')).rejects.toThrow();
});
