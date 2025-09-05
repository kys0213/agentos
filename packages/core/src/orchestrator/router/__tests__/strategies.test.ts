import { CompositeAgentRouter } from '../composite-router';
import { BM25TextStrategy } from '../strategies/bm25-text-strategy';
import { MentionStrategy } from '../strategies/mention-strategy';
import { KeywordBoostStrategy } from '../strategies/keyword-boost-strategy';
import { ToolHintStrategy } from '../strategies/tool-hint-strategy';
import { FileTypeStrategy } from '../strategies/file-type-strategy';
import { EnglishSimpleTokenizer } from '../../../knowledge/tokenizer';
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
    preset: init.preset ?? {
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

const tokenizer = new EnglishSimpleTokenizer();

test('mention strategy overrides bm25 when hinted', async () => {
  const a1 = new StubAgent(meta({ id: 'alpha', name: 'Alpha', description: 'generic helper' }));
  const a2 = new StubAgent(
    meta({ id: 'beta', name: 'Beta', description: 'beta specialist for sorting' })
  );
  const router = new CompositeAgentRouter([BM25TextStrategy, MentionStrategy], { tokenizer });
  const q: RouterQuery = { text: 'sort these numbers', hints: ['beta'] };
  const out = await router.route(q, [a1, a2], { topK: 1 });
  expect(out.agents[0].id).toBe('beta');
});

test('bm25 ranks by metadata doc relevance', async () => {
  const a1 = new StubAgent(
    meta({ id: 'alpha', name: 'Alpha', description: 'alpha focused on markdown' })
  );
  const a2 = new StubAgent(
    meta({ id: 'beta', name: 'Beta', description: 'beta focused on sorting arrays' })
  );
  const router = new CompositeAgentRouter([BM25TextStrategy], { tokenizer });
  const q: RouterQuery = { text: 'sorting arrays' };
  const out = await router.route(q, [a1, a2], { topK: 1 });
  expect(out.agents[0].id).toBe('beta');
});

test('keyword boost and tool/file type hints apply small boosts', async () => {
  const a1 = new StubAgent(
    meta({
      id: 'v',
      name: 'Vision',
      keywords: ['image', 'vision'],
      preset: {
        id: 'p1',
        name: 'p1',
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
        category: ['multimodal'],
        enabledMcps: [
          {
            name: 'toolpack',
            enabledTools: [{ name: 'detect-objects', title: 'Detect Objects', description: '' }],
            enabledResources: [],
            enabledPrompts: [],
          },
        ],
      },
    })
  );
  const a2 = new StubAgent(
    meta({
      id: 't',
      name: 'TextOnly',
      keywords: ['text'],
      preset: {
        id: 'p2',
        name: 'p2',
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
    })
  );

  const router = new CompositeAgentRouter(
    [KeywordBoostStrategy, ToolHintStrategy, FileTypeStrategy],
    { tokenizer }
  );
  const q: RouterQuery = {
    text: 'image classification',
    hints: ['detect-objects'],
    content: [{ contentType: 'image', value: Buffer.from('x') }],
  };
  const out = await router.route(q, [a2, a1], { topK: 1 });
  expect(out.agents[0].id).toBe('v');
});
