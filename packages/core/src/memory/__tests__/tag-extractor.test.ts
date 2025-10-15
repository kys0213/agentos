import { describe, expect, test } from 'vitest';
import { LlmTagExtractor } from '../tag-extractor';
import type { LlmBridge, LlmBridgePrompt, LlmBridgeResponse, LlmMetadata } from 'llm-bridge-spec';

class MockLlm implements LlmBridge {
  constructor(private readonly responses: string[]) {}

  private callCount = 0;

  async invoke(_: LlmBridgePrompt): Promise<LlmBridgeResponse> {
    const value = this.responses[this.callCount] ?? '[]';
    this.callCount += 1;
    return {
      content: { contentType: 'text', value },
    } as LlmBridgeResponse;
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'mock-llm',
      description: 'mock keyword extractor',
      model: 'mock',
      contextWindow: 4096,
      maxTokens: 1024,
    };
  }
}

describe('LlmTagExtractor', () => {
  test('dedupes existing tags and respects max tags', async () => {
    const llm = new MockLlm(['["Project", "timeline", "Project scope"]']);
    const extractor = new LlmTagExtractor(llm, { maxTags: 5 });
    const tags = await extractor.extract({
      texts: ['Project deadline update for Q3 launch'],
      existing: ['timeline'],
      maxTags: 1,
    });
    expect(tags).toEqual(['Project']);
  });
});
