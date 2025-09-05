import { CompositeAgentRouter } from '../composite-router';
import { BM25TextStrategy } from '../strategies/bm25-text-strategy';
import { EnglishSimpleTokenizer } from '../../../knowledge/tokenizer';
import type { Agent, AgentChatResult } from '../../../agent/agent';
import type { AgentSession } from '../../../agent/agent-session';
import type { ReadonlyAgentMetadata } from '../../../agent/agent-metadata';
import type { RouterQuery, LlmReranker, LlmRoutingPolicy } from '../types';
import { RouterHelper } from '../helper';

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

class FakeReranker implements LlmReranker {
  async rerank(args: {
    query: RouterQuery;
    candidates: Array<{ agentId: string; doc: string }>;
    helper: RouterHelper;
    policy: LlmRoutingPolicy;
  }) {
    // Favor the agent whose doc contains the word "special"
    return args.candidates.map(({ agentId, doc }) => ({
      agentId,
      score: doc.includes('special') ? 1 : 0,
    }));
  }
}

test('LLM reranker adjusts top-N ordering with blending', async () => {
  const a1 = new StubAgent(meta('alpha', 'Alpha', 'generic helper'));
  const a2 = new StubAgent(meta('beta', 'Beta', 'special sorting arrays'));
  const router = new CompositeAgentRouter([BM25TextStrategy], {
    tokenizer: new EnglishSimpleTokenizer(),
    llm: {
      policy: { enableKeyword: false, enableRerank: true, topN: 2, alphaBlend: 0.5 },
      reranker: new FakeReranker(),
    },
  });
  const q: RouterQuery = { text: 'sort arrays quickly' };
  const out = await router.route(q, [a1, a2], { topK: 1 });
  expect(out.agents[0].id).toBe('beta');
});
