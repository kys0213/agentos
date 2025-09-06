import { CompositeAgentRouter } from '../composite-router';
import { BM25TextStrategy } from '../strategies/bm25-text-strategy';
import { KeywordBoostStrategy } from '../strategies/keyword-boost-strategy';
import { MentionStrategy } from '../strategies/mention-strategy';
import { EnglishSimpleTokenizer } from 'src/knowledge/english-simple-tokenizer';
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

function meta(i: number): ReadonlyAgentMetadata {
  return {
    id: `a${i}`,
    name: `Agent ${i}`,
    description: i % 2 === 0 ? 'sort arrays and numbers' : 'markdown and text utilities',
    icon: '🤖',
    keywords: i % 3 === 0 ? ['sort', 'array'] : ['markdown'],
    preset: {
      id: `p${i}`,
      name: `p${i}`,
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
      category: i % 5 === 0 ? ['multimodal'] : [],
    },
    status: 'active',
    usageCount: 0,
    sessionCount: 0,
  } as ReadonlyAgentMetadata;
}

test('perf smoke: 100 agents routes quickly', async () => {
  const agents: Agent[] = Array.from({ length: 100 }, (_, i) => new StubAgent(meta(i)));
  const router = new CompositeAgentRouter(
    [BM25TextStrategy, KeywordBoostStrategy, MentionStrategy],
    { tokenizer: new EnglishSimpleTokenizer() }
  );
  const q: RouterQuery = { text: 'how to sort an array of numbers quickly' };

  // warm-up
  await router.route(q, agents, { topK: 3 });

  const runs = 5;
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = Date.now();
    await router.route(q, agents, { topK: 3 });
    times.push(Date.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / runs;
  // Relaxed threshold to avoid CI flakiness; target is < 25ms local
  expect(avg).toBeLessThan(150);
});
