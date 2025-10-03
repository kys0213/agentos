import { describe, expect, it } from 'vitest';
import type {
  Agent,
  AgentChatResult,
  AgentMetadata,
  AgentService,
  CreateAgentMetadata,
  CursorPaginationResult,
  UserMessage,
} from '@agentos/core';
import type { ChatService } from '../../chat/chat.service';
import { AgentSessionService } from '../agent.service';
import { AgentEventBridge } from '../events/agent-event-bridge';
import { OutboundChannel } from '../../common/event/outbound-channel';
import type { MessageHistory } from '@agentos/core';

class StubChatService implements Pick<ChatService, 'appendMessageToSession'> {
  public appended: { sessionId: string; agentId: string; message: MessageHistory }[] = [];

  async appendMessageToSession(sessionId: string, agentId: string, message: MessageHistory): Promise<void> {
    this.appended.push({ sessionId, agentId, message });
  }
}

class TestAgent implements Agent {
  constructor(private metadata: AgentMetadata) {}

  get id(): string {
    return this.metadata.id;
  }

  async chat(messages: UserMessage[]): Promise<AgentChatResult> {
    return {
      sessionId: `${this.metadata.id}-session`,
      messages: [
        ...messages,
        {
          role: 'assistant',
          content: [
            {
              contentType: 'text',
              value: `Response from ${this.metadata.name}`,
            },
          ],
        },
      ],
    };
  }

  async createSession() {
    throw new Error('not implemented');
  }

  async getMetadata(): Promise<AgentMetadata> {
    return this.metadata;
  }

  async update(patch: Partial<AgentMetadata>): Promise<void> {
    this.metadata = { ...this.metadata, ...patch } as AgentMetadata;
  }

  async delete(): Promise<void> {}

  async isActive(): Promise<boolean> {
    return this.metadata.status === 'active';
  }

  async isIdle(): Promise<boolean> {
    return this.metadata.status === 'idle';
  }

  async isInactive(): Promise<boolean> {
    return this.metadata.status === 'inactive';
  }

  async isError(): Promise<boolean> {
    return this.metadata.status === 'error';
  }

  async idle(): Promise<void> {}

  async activate(): Promise<void> {}

  async inactive(): Promise<void> {}

  async endSession(): Promise<void> {}
}

class InMemoryAgentService implements AgentService {
  private agents = new Map<string, TestAgent>();
  private idCounter = 0;

  async createAgent(payload: CreateAgentMetadata): Promise<Agent> {
    const id = `agent-${++this.idCounter}`;
    const metadata: AgentMetadata = {
      id,
      version: '1',
      name: payload.name,
      description: payload.description,
      icon: payload.icon,
      keywords: payload.keywords,
      preset: payload.preset,
      status: payload.status,
      lastUsed: undefined,
      sessionCount: 0,
      usageCount: 0,
    };
    const agent = new TestAgent(metadata);
    this.agents.set(id, agent);
    return agent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    return this.agents.get(id) ?? null;
  }

  async listAgents(): Promise<CursorPaginationResult<Agent>> {
    return {
      items: Array.from(this.agents.values()),
      nextCursor: '',
      hasMore: false,
    };
  }

  async searchAgents(): Promise<CursorPaginationResult<Agent>> {
    return this.listAgents();
  }

  async createSession() {
    throw new Error('not implemented');
  }

  async execute() {
    throw new Error('not implemented');
  }
}

const buildCreateAgentPayload = (name: string): CreateAgentMetadata => ({
  name,
  description: `${name} agent used in tests`,
  icon: '🤖',
  keywords: [],
  status: 'active',
  preset: {
    id: `${name.toLowerCase()}-preset`,
    name: `${name} Preset`,
    description: 'Stub preset',
    author: 'tests',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: `You are ${name}`,
    enabledMcps: [],
    llmBridgeName: 'stub-bridge',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: ['development'],
  },
});

describe('AgentSessionService - multi agent execution', () => {
  it('broadcasts chat results for primary and mentioned agents', async () => {
    const agentService = new InMemoryAgentService();
    const outbound = new OutboundChannel();
    const eventBridge = new AgentEventBridge(outbound);
    const chatService = new StubChatService();
    const sessionService = new AgentSessionService(agentService, eventBridge, chatService);

    const primary = await sessionService.createAgent(buildCreateAgentPayload('Alpha'));
    const secondary = await sessionService.createAgent(buildCreateAgentPayload('Beta'));

    const message: UserMessage = {
      role: 'user',
      content: [{ contentType: 'text', value: 'Status report' }],
    };

    const result = await sessionService.chat(primary.id, [message], { sessionId: 'multi' }, [secondary.id]);

    const assistantMessages = result.messages.filter((msg) => msg.role === 'assistant');
    expect(assistantMessages).toHaveLength(2);

    const assistantTexts = assistantMessages.map((msg) => {
      const first = Array.isArray(msg.content) ? msg.content[0] : undefined;
      return typeof first === 'object' && first !== null && 'value' in first ? (first as any).value : undefined;
    });
    expect(assistantTexts).toContain('Response from Alpha');
    expect(assistantTexts).toContain('Response from Beta');

    const metadataIds = chatService.appended.map((entry) => entry.message.agentMetadata?.id);
    expect(new Set(metadataIds)).toEqual(new Set([primary.id, secondary.id]));
  });
});
