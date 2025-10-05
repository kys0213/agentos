import { describe, expect, it, vi } from 'vitest';
import type {
  Agent,
  AgentChatResult,
  AgentMetadata,
  AgentRouter,
  AgentService,
  CursorPaginationResult,
  ReadonlyAgentMetadata,
  RouterOutput,
  RouterQuery,
} from '@agentos/core';
import type { UserMessage } from 'llm-bridge-spec';
import { MultiAgentCoordinator } from '../multi-agent-coordinator';

class StubAgent implements Agent {
  public readonly id: string;

  constructor(private readonly metadata: ReadonlyAgentMetadata) {
    this.id = metadata.id;
  }

  async chat(messages: UserMessage[]): Promise<AgentChatResult> {
    return {
      sessionId: `${this.id}-session`,
      messages: messages.map((msg) => ({
        ...msg,
        role: 'assistant',
        content: msg.content,
      })),
    };
  }

  async createSession() {
    return Promise.reject(new Error('not implemented'));
  }

  async getMetadata() {
    return this.metadata;
  }

  async isActive() {
    return this.metadata.status === 'active';
  }

  async isIdle() {
    return this.metadata.status === 'idle';
  }

  async isInactive() {
    return this.metadata.status === 'inactive';
  }

  async isError() {
    return this.metadata.status === 'error';
  }

  async idle() {}

  async activate() {}

  async inactive() {}

  async update() {}

  async delete() {}

  async endSession() {}
}

const createMetadata = (overrides: Partial<AgentMetadata>): ReadonlyAgentMetadata => ({
  id: overrides.id ?? 'agent-id',
  name: overrides.name ?? 'Agent',
  description: overrides.description ?? 'Test agent',
  icon: overrides.icon ?? '🧪',
  keywords: overrides.keywords ?? [],
  preset: overrides.preset ?? {
    id: `${overrides.id ?? 'agent'}-preset`,
    name: `${overrides.name ?? 'Agent'} Preset`,
    description: 'preset',
    author: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: 'You are a stub.',
    enabledMcps: [],
    llmBridgeName: 'test-bridge',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: [],
  },
  status: overrides.status ?? 'active',
  sessionCount: overrides.sessionCount ?? 0,
  usageCount: overrides.usageCount ?? 0,
  version: overrides.version,
  lastUsed: overrides.lastUsed,
});

const createAgentStub = (id: string, name: string, status: AgentMetadata['status'] = 'active') =>
  new StubAgent(
    createMetadata({
      id,
      name,
      description: `${name} agent`,
      status,
    })
  );

const createAgentServiceStub = (agents: Agent[]): AgentService => {
  const agentMap = new Map<string, Agent>(agents.map((agent) => [agent.id, agent]));

  return {
    async createAgent() {
      throw new Error('not implemented');
    },
    async getAgent(agentId: string) {
      return agentMap.get(agentId) ?? null;
    },
    async listAgents(): Promise<CursorPaginationResult<Agent>> {
      return {
        items: agents,
        nextCursor: '',
        hasMore: false,
      };
    },
    async searchAgents() {
      throw new Error('not implemented');
    },
    async createSession() {
      throw new Error('not implemented');
    },
    async execute() {
      throw new Error('not implemented');
    },
  };
};

const sampleMessage: UserMessage = {
  role: 'user',
  content: [{ contentType: 'text', value: 'help me' }],
};

describe('MultiAgentCoordinator', () => {
  it('executes primary and mentioned agents without routing', async () => {
    const alpha = createAgentStub('alpha', 'Alpha');
    const beta = createAgentStub('beta', 'Beta');
    const service = createAgentServiceStub([alpha, beta]);
    const coordinator = new MultiAgentCoordinator(service);

    const result = await coordinator.execute({
      primaryAgentId: 'alpha',
      messages: [sampleMessage],
      mentionedAgentIds: ['beta'],
      options: { sessionId: 'alpha-session' },
    });

    const executionIds = result.executions.map((exec) => exec.agent.id);
    expect(executionIds).toEqual(['alpha', 'beta']);
    expect(result.sessionId).toBe('alpha-session');
  });

  it('falls back to router results when no mentions are provided', async () => {
    const alpha = createAgentStub('alpha', 'Alpha');
    const beta = createAgentStub('beta', 'Beta');
    const gamma = createAgentStub('gamma', 'Gamma');
    const router: AgentRouter = {
      route: vi.fn(
        async (_query: RouterQuery, agents: Agent[]): Promise<RouterOutput> => ({
          agents: [agents[1]],
        })
      ),
    };

    const service = createAgentServiceStub([alpha, beta, gamma]);
    const coordinator = new MultiAgentCoordinator(service, router);

    const result = await coordinator.execute({
      primaryAgentId: 'alpha',
      messages: [sampleMessage],
      mentionedAgentIds: [],
      options: {},
    });

    const executionIds = result.executions.map((exec) => exec.agent.id);
    expect(executionIds).toEqual(['alpha']);
    expect(router.route).not.toHaveBeenCalled();
  });
});
