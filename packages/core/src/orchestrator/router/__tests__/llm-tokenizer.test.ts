import { CompositeAgentRouter } from '../composite-router';
import { BM25TextStrategy } from '../strategies/bm25-text-strategy';
import { KeywordExtractor } from '../../../knowledge/tokenizer';
import { EnglishSimpleTokenizer } from '../../../knowledge/english-simple-tokenizer';
import type { Agent, AgentChatResult } from '../../../agent/agent';
import type { AgentSession } from '../../../agent/agent-session';
import type { ReadonlyAgentMetadata } from '../../../agent/agent-metadata';
import type { RouterQuery } from '../types';

const makeStubAgent = (m: ReadonlyAgentMetadata): Agent => ({
  get id() {
    return m.id;
  },
  async chat(): Promise<AgentChatResult> {
    throw new Error('not used');
  },
  async createSession(): Promise<AgentSession> {
    throw new Error('not used');
  },
  async getMetadata() {
    return m;
  },
  async isActive() {
    return m.status === 'active';
  },
  async isIdle() {
    return m.status === 'idle';
  },
  async isInactive() {
    return m.status === 'inactive';
  },
  async isError() {
    return m.status === 'error';
  },
  async idle() {},
  async activate() {},
  async inactive() {},
  async update() {},
  async delete() {},
  async endSession() {},
});

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

const makeExtractor = () => {
  let calls = 0;
  const extractor: KeywordExtractor & { calls: number } = {
    get calls() {
      return calls;
    },
    async extractKeywords(text: string): Promise<string[]> {
      calls++;
      if (text.includes('정렬') || text.includes('배열')) {
        return ['정렬', '배열', '방법'];
      }
      return ['마크다운'];
    },
  };
  return extractor;
};

test('uses LLM keyword tokenizer for ko locale when enabled', async () => {
  const a1 = makeStubAgent(meta({ id: 'vision', name: '비전', description: '정렬 배열 도우미' }));
  const a2 = makeStubAgent(meta({ id: 'md', name: '마크다운', description: '마크다운 도우미' }));
  const extractor = makeExtractor();
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
