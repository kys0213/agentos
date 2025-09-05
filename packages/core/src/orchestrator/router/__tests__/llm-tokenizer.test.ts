import { CompositeAgentRouter } from '../composite-router';
import { BM25TextStrategy } from '../strategies/bm25-text-strategy';
import { EnglishSimpleTokenizer, KeywordExtractor } from '../../../knowledge/tokenizer';
import type { Agent, AgentChatResult } from '../../../agent/agent';
import type { AgentSession } from '../../../agent/agent-session';
import type { ReadonlyAgentMetadata } from '../../../agent/agent-metadata';
import type { RouterQuery } from '../types';

class StubAgent implements Agent {
  constructor(private meta: ReadonlyAgentMetadata) {}
  get id() {
    return this.meta.id;
  }
  async chat(): Promise<AgentChatResult> {
    throw new Error('not used');
  }
  async createSession(): Promise<AgentSession> {
    throw new Error('not used');
  }
  async getMetadata(): Promise<ReadonlyAgentMetadata> {
    return this.meta;
  }
  async isActive() {
    return this.meta.status === 'active';
  }
  async isIdle() {
    return this.meta.status === 'idle';
  }
  async isInactive() {
    return this.meta.status === 'inactive';
  }
  async isError() {
    return this.meta.status === 'error';
  }
  async idle() {}
  async activate() {}
  async inactive() {}
  async update() {}
  async delete() {}
  async endSession() {}
}

function meta(
  init: Partial<ReadonlyAgentMetadata> & { id: string; name: string }
): ReadonlyAgentMetadata {
  return {
    id: init.id,
    name: init.name,
    description: init.description ?? init.name,
    icon: '🤖',
    keywords: init.keywords ?? [],
    preset: {
      id: 'p',
      name: 'p',
      description: '',
      author: 'a',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1',
      systemPrompt: 'x',
      llmBridgeName: 'b',
      llmBridgeConfig: {},
      status: 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
      category: [],
    },
    status: init.status ?? 'active',
    lastUsed: init.lastUsed,
    sessionCount: init.sessionCount ?? 0,
    usageCount: init.usageCount ?? 0,
    version: init.version,
  } as ReadonlyAgentMetadata;
}

class FakeExtractor implements KeywordExtractor {
  public calls = 0;
  async extractKeywords(text: string): Promise<string[]> {
    this.calls++;
    // Return tokens based on input to differentiate docs
    if (text.includes('정렬') || text.includes('배열')) {
      return ['정렬', '배열', '방법'];
    }
    return ['마크다운'];
  }
}

test('uses LLM keyword tokenizer for ko locale when enabled', async () => {
  const a1 = new StubAgent(meta({ id: 'vision', name: '비전', description: '정렬 배열 도우미' }));
  const a2 = new StubAgent(meta({ id: 'md', name: '마크다운', description: '마크다운 도우미' }));
  const extractor = new FakeExtractor();
  const router = new CompositeAgentRouter([BM25TextStrategy], {
    tokenizer: new EnglishSimpleTokenizer(),
    llmKeyword: { extractor, when: 'locale_cjk' },
  });
  const q: RouterQuery = { text: '배열 정렬 방법?', locale: 'ko' };
  const out = await router.route(q, [a2, a1], { topK: 1 });
  expect(out.agents[0].id).toBe('vision');
  // ensure extractor was called at least once
  expect(extractor.calls).toBeGreaterThan(0);
});
