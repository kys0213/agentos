import { CompositeAgentRouter } from '../composite-router';
import type { RoutingStrategyFn, RouterQuery, ScoreResult } from '../types';
import { EnglishSimpleTokenizer } from '../../../knowledge/tokenizer';
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
  async idle() {
    /* noop */
  }
  async activate() {
    /* noop */
  }
  async inactive() {
    /* noop */
  }
  async update() {
    /* noop */
  }
  async delete() {
    /* noop */
  }
  async endSession() {
    /* noop */
  }
}

function meta(
  id: string,
  name: string,
  status: 'active' | 'idle' | 'inactive' | 'error',
  usageCount = 0,
  lastUsed?: Date
): ReadonlyAgentMetadata {
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
    status,
    lastUsed,
    sessionCount: 0,
    usageCount,
  } as ReadonlyAgentMetadata;
}

const tokenizer = new EnglishSimpleTokenizer();

test('composite router sorts by score then tie-breakers', async () => {
  const a1 = new StubAgent(meta('a1', 'Alpha', 'active', 10, new Date('2024-01-02')));
  const a2 = new StubAgent(meta('a2', 'Beta', 'active', 5, new Date('2024-01-01')));

  const stratConstant: RoutingStrategyFn = async ({ metas }) => {
    const m = new Map<string, ScoreResult>();
    // equal scores → tie-breaker by lastUsed then usageCount then name
    for (const x of metas) {
      m.set(x.id, { score: 0.5 });
    }
    return m;
  };

  const router = new CompositeAgentRouter([stratConstant], { tokenizer });
  const q: RouterQuery = { text: 'hello' };
  const out = await router.route(q, [a2, a1], { topK: 2, includeScores: true });
  expect(out.agents.map((a) => a.id)).toEqual(['a1', 'a2']);
  expect(out.scores?.length).toBe(2);
});

test('idle agent requires hint mention to be included', async () => {
  const active = new StubAgent(meta('a1', 'Alpha', 'active'));
  const idle = new StubAgent(meta('a2', 'Beta', 'idle'));
  const stratZero: RoutingStrategyFn = async ({ metas }) => {
    const m = new Map<string, ScoreResult>();
    for (const x of metas) {
      m.set(x.id, { score: 0.1 });
    }
    return m;
  };
  const router = new CompositeAgentRouter([stratZero], { tokenizer });

  // without hint → only active
  const out1 = await router.route({ text: 'hi' }, [active, idle], { topK: 5 });
  expect(out1.agents.map((a) => a.id)).toEqual(['a1']);

  // with hint matching idle name → both included, but active can still rank higher on tie rules
  const out2 = await router.route({ text: 'hi', hints: ['beta'] }, [active, idle], { topK: 5 });
  expect(out2.agents.map((a) => a.id)).toContain('a2');
});
