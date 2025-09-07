import { CompositeAgentRouter } from '../composite-router';
import { BM25TextStrategy } from '../strategies/bm25-text-strategy';
import { EnglishSimpleTokenizer } from '../../../knowledge/english-simple-tokenizer';
import type { Agent, AgentChatResult } from '../../../agent/agent';
import type { AgentSession } from '../../../agent/agent-session';
import type { ReadonlyAgentMetadata } from '../../../agent/agent-metadata';
import type { RouterQuery, LlmReranker, LlmRoutingPolicy } from '../types';
import { RouterHelper } from '../helper';

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

function meta(id: string, name: string, desc: string): ReadonlyAgentMetadata {
  return {
    id,
    name,
    description: desc,
    icon: '🤖',
    keywords: [],
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
    status: 'active',
    usageCount: 0,
    sessionCount: 0,
  } as ReadonlyAgentMetadata;
}

const makeReranker = (): LlmReranker => ({
  async rerank(args: {
    query: RouterQuery;
    candidates: Array<{ agentId: string; doc: string }>;
    helper: RouterHelper;
    policy: LlmRoutingPolicy;
  }) {
    return args.candidates.map(({ agentId, doc }) => ({
      agentId,
      score: doc.includes('special') ? 1 : 0,
    }));
  },
});

test('LLM reranker adjusts top-N ordering with blending', async () => {
  const a1 = makeStubAgent(meta('alpha', 'Alpha', 'generic helper'));
  const a2 = makeStubAgent(meta('beta', 'Beta', 'special sorting arrays'));
  const router = new CompositeAgentRouter([BM25TextStrategy], {
    tokenizer: new EnglishSimpleTokenizer(),
    llm: {
      policy: { enableKeyword: false, enableRerank: true, topN: 2, alphaBlend: 0.5 },
      reranker: makeReranker(),
    },
  });
  const q: RouterQuery = { text: 'sort arrays quickly' };
  const out = await router.route(q, [a1, a2], { topK: 1 });
  expect(out.agents[0].id).toBe('beta');
});
