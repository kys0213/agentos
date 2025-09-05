import { RouterBuilder } from '../router-builder';
import type { RoutingStrategyFn, ScoreResult, RouterQuery } from '../types';
import { EnglishSimpleTokenizer } from 'src/knowledge/english-simple-tokenizer';
import type { Agent, AgentChatResult } from '../../../agent/agent';
import type { AgentSession } from '../../../agent/agent-session';
import type { ReadonlyAgentMetadata } from '../../../agent/agent-metadata';

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

function meta(id: string, name: string): ReadonlyAgentMetadata {
  return {
    id,
    name,
    description: name,
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

test('fluent RouterBuilder constructs a working router', async () => {
  const a1 = new StubAgent(meta('a1', 'Alpha'));
  const a2 = new StubAgent(meta('a2', 'Beta'));
  const strat: RoutingStrategyFn = async ({ metas }) => {
    const m = new Map<string, ScoreResult>();
    for (const x of metas) {
      m.set(x.id, { score: x.name === 'Beta' ? 1 : 0.5 });
    }
    return m;
  };

  const router = RouterBuilder.create(new EnglishSimpleTokenizer())
    .strategy(strat)
    .compare((a, b) => b.score - a.score)
    .build();

  const q: RouterQuery = { text: 'any' };
  const out = await router.route(q, [a1, a2], { topK: 1 });
  expect(out.agents[0].id).toBe('a2');
});
