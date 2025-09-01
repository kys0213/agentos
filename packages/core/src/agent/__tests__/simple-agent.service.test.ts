import { mock } from 'jest-mock-extended';
import type { Agent, AgentChatResult } from '../agent';
import type { AgentMetadata, ReadonlyAgentMetadata } from '../agent-metadata';
import type { AgentSession } from '../agent-session';
import { SimpleAgentService } from '../simple-agent.service';
import { LlmBridgeRegistry } from '../../llm/bridge/registry';
import type { LlmBridge } from 'llm-bridge-spec';
import { McpRegistry } from '../../tool/mcp/mcp.registery';
import type { ChatManager } from '../../chat/chat.manager';
import type { AgentMetadataRepository } from '../agent-metadata.repository';
import type { ReadonlyPreset, Preset } from '../../preset/preset';
import type { AgentStatus } from '../agent';
import type { ChatSession, MessageHistory } from '../../chat/chat-session';

class FakeSession implements AgentSession {
  constructor(public readonly sessionId: string) {}
  agentId: string = 'a1';
  get id() {
    return this.sessionId;
  }
  async chat(): Promise<Readonly<MessageHistory>[]> {
    return [] as Readonly<MessageHistory>[];
  }
  async getHistory() {
    return { items: [] as Readonly<MessageHistory>[], nextCursor: '', hasMore: false };
  }
  async terminate(): Promise<void> {}
  on(): () => void {
    return () => {};
  }
  async providePromptResponse(): Promise<void> {}
  async provideConsentDecision(): Promise<void> {}
  async provideSensitiveInput(): Promise<void> {}
}

class FakeAgent implements Agent {
  constructor(
    public readonly id: string,
    private readonly meta: ReadonlyAgentMetadata
  ) {}
  update(patch: Partial<AgentMetadata>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async chat(): Promise<AgentChatResult> {
    return { messages: [], sessionId: 's-1' };
  }
  async createSession(): Promise<AgentSession> {
    return new FakeSession('s-1');
  }
  async getMetadata(): Promise<ReadonlyAgentMetadata> {
    return this.meta;
  }
  async isActive(): Promise<boolean> {
    return this.meta.status === 'active';
  }
  async isIdle(): Promise<boolean> {
    return this.meta.status === 'idle';
  }
  async isInactive(): Promise<boolean> {
    return this.meta.status === 'inactive';
  }
  async isError(): Promise<boolean> {
    return this.meta.status === 'error';
  }
  async idle(): Promise<void> {}
  async activate(): Promise<void> {}
  async inactive(): Promise<void> {}
  async endSession(): Promise<void> {}
}

describe('SimpleAgentService', () => {
  function preset(): ReadonlyPreset {
    const p: Preset = {
      id: 'p1',
      name: 'Preset',
      description: '',
      author: 't',
      createdAt: new Date(0),
      updatedAt: new Date(0),
      version: '1.0.0',
      systemPrompt: '',
      enabledMcps: [],
      llmBridgeName: 'x',
      llmBridgeConfig: {},
      status: 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
      category: [],
    };
    return p;
  }

  function meta(id: string, status: AgentStatus = 'active'): ReadonlyAgentMetadata {
    return {
      id,
      version: '1',
      name: `Agent ${id}`,
      description: `desc ${id}`,
      icon: '🤖',
      keywords: ['alpha', id],
      preset: preset(),
      status,
      lastUsed: new Date(),
      sessionCount: 0,
      usageCount: 0,
    };
  }

  it('lists and gets agents', async () => {
    const repo = mock<AgentMetadataRepository>();
    const llmReg = mock<LlmBridgeRegistry>();
    const mcpReg = mock<McpRegistry>();
    const chatMgr = mock<ChatManager>();

    const m1 = meta('a1');
    const m2 = meta('a2');

    repo.list.mockResolvedValue({ items: [m1, m2], nextCursor: '', hasMore: false });
    repo.get.mockImplementation(async (id: string) => (id === 'a1' ? m1 : id === 'a2' ? m2 : null));
    repo.getOrThrow.mockImplementation(async (id: string) => (id === 'a1' ? m1 : m2));
    const llm = mock<LlmBridge>();
    llm.invoke.mockResolvedValue({ content: { contentType: 'text', value: 'ok' }, toolCalls: [] });
    llmReg.getBridgeByName.mockResolvedValue(llm);

    const svc = new SimpleAgentService(llmReg, mcpReg, chatMgr, repo);
    const list = await svc.listAgents();
    expect(list.items.map((a) => a.id).sort()).toEqual(['a1', 'a2']);
    const got = await svc.getAgent('a2');
    expect(got?.id).toBe('a2');
  });

  it('searches via repository metadata filtering', async () => {
    const repo = mock<AgentMetadataRepository>();
    const llmReg = mock<LlmBridgeRegistry>();
    const mcpReg = mock<McpRegistry>();
    const chatMgr = mock<ChatManager>();

    const m1 = meta('a1');
    repo.search.mockResolvedValue({ items: [m1], nextCursor: '', hasMore: false });
    repo.get.mockResolvedValue(m1);
    repo.getOrThrow.mockResolvedValue(m1);
    const llm = mock<LlmBridge>();
    llm.invoke.mockResolvedValue({ content: { contentType: 'text', value: 'ok' }, toolCalls: [] });
    llmReg.getBridgeByName.mockResolvedValue(llm);

    const svc = new SimpleAgentService(llmReg, mcpReg, chatMgr, repo);
    const res = await svc.searchAgents({ name: 'Agent a1' });
    expect(res.items.map((a) => a.id)).toEqual(['a1']);
  });

  it('creates session via materialized agent', async () => {
    const repo = mock<AgentMetadataRepository>();
    const llmReg = mock<LlmBridgeRegistry>();
    const mcpReg = mock<McpRegistry>();
    const chatMgr = mock<ChatManager>();
    const m1 = meta('a1');
    repo.get.mockResolvedValue(m1);
    repo.getOrThrow.mockResolvedValue(m1);
    const llm = mock<LlmBridge>();
    llm.invoke.mockResolvedValue({ content: { contentType: 'text', value: 'ok' }, toolCalls: [] });
    llmReg.getBridgeByName.mockResolvedValue(llm);
    const chatSession: ChatSession = {
      sessionId: 's-1',
      agentId: 'a1',
      appendMessage: async () => ({
        messageId: 'm1',
        role: 'assistant',
        content: [{ contentType: 'text', value: 'ok' }],
        createdAt: new Date(),
      }),
      sumUsage: async () => {},
      getHistories: async () => ({ items: [], nextCursor: '', hasMore: false }),
      getCheckpoints: async () => ({ items: [], nextCursor: '', hasMore: false }),
      getMetadata: async () => ({
        sessionId: 's-1',
        agentId: 'a1',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: '',
        totalMessages: 0,
        totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        recentMessages: [],
        joinedAgents: [],
      }),
      commit: async () => {},
    };
    chatMgr.create.mockResolvedValue(chatSession);

    const svc = new SimpleAgentService(llmReg, mcpReg, chatMgr, repo);
    const session = await svc.createSession('a1');
    expect(session.sessionId).toBe('s-1');
  });

  it('delegates execute to agent.chat', async () => {
    const repo = mock<AgentMetadataRepository>();
    const llmReg = mock<LlmBridgeRegistry>();
    const mcpReg = mock<McpRegistry>();
    const chatMgr = mock<ChatManager>();
    const m1 = meta('a1');
    repo.get.mockResolvedValue(m1);
    repo.getOrThrow.mockResolvedValue(m1);
    const llm = mock<LlmBridge>();
    llm.invoke.mockResolvedValue({ content: { contentType: 'text', value: 'ok' }, toolCalls: [] });
    llmReg.getBridgeByName.mockResolvedValue(llm);
    const chatSession: ChatSession = {
      sessionId: 's-1',
      agentId: 'a1',
      appendMessage: async () => ({
        messageId: 'm1',
        role: 'assistant',
        content: [{ contentType: 'text', value: 'ok' }],
        createdAt: new Date(),
      }),
      sumUsage: async () => {},
      getHistories: async () => ({ items: [], nextCursor: '', hasMore: false }),
      getCheckpoints: async () => ({ items: [], nextCursor: '', hasMore: false }),
      getMetadata: async () => ({
        sessionId: 's-1',
        agentId: 'a1',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: '',
        totalMessages: 0,
        totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        recentMessages: [],
        joinedAgents: [],
      }),
      commit: async () => {},
    };
    chatMgr.create.mockResolvedValue(chatSession);

    const svc = new SimpleAgentService(llmReg, mcpReg, chatMgr, repo);
    const result = await svc.execute('a1', [], {});
    expect(result.sessionId).toBe('s-1');
    expect(Array.isArray(result.messages)).toBe(true);
  });
});
