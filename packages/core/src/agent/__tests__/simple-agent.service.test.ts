import { mock } from 'jest-mock-extended';
import type { Agent, AgentChatResult } from '../agent';
import type { AgentMetadata, ReadonlyAgentMetadata } from '../agent-metadata';
import type { AgentSession } from '../agent-session';
import { SimpleAgentService } from '../simple-agent.service';
import { LlmBridgeRegistry } from '../../llm/bridge/registry';
import type { LlmBridge } from 'llm-bridge-spec';
import { McpRegistry } from '../../tool/mcp/mcp.registery';
import { ChatManager } from '../../chat/chat.manager';
import { AgentMetadataRepository } from '../agent-metadata.repository';

class FakeSession implements AgentSession {
  constructor(public readonly sessionId: string) {}
  agentId: string = 'a1';
  get id() {
    return this.sessionId;
  }
  async chat(): Promise<Readonly<any>[]> {
    return [];
  }
  async getHistory(): Promise<any> {
    return { items: [], nextCursor: '', hasMore: false };
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
  function meta(id: string, status: any = 'active'): ReadonlyAgentMetadata {
    return {
      id,
      version: '1',
      name: `Agent ${id}`,
      description: `desc ${id}`,
      icon: '🤖',
      keywords: ['alpha', id],
      preset: {} as any,
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

    const manifestName = 'x';
    const m1 = meta('a1');
    const m2 = meta('a2');
    // ensure preset has llm bridge name
    (m1 as any).preset = { llmBridgeName: manifestName, enabledMcps: [] } as any;
    (m2 as any).preset = { llmBridgeName: manifestName } as any;

    repo.list.mockResolvedValue({ items: [m1, m2], nextCursor: '', hasMore: false });
    repo.get.mockImplementation(async (id: string) => (id === 'a1' ? m1 : id === 'a2' ? m2 : null) as any);
    (repo.getOrThrow as any).mockImplementation(async (id: string) => (id === 'a1' ? m1 : m2));
    llmReg.getBridgeByName.mockResolvedValue(mock<LlmBridge>() as unknown as LlmBridge);

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

    const manifestName = 'x';
    const m1 = meta('a1');
    (m1 as any).preset = { llmBridgeName: manifestName } as any;
    repo.search.mockResolvedValue({ items: [m1], nextCursor: '', hasMore: false });
    repo.get.mockResolvedValue(m1);
    (repo.getOrThrow as any).mockResolvedValue(m1);
    llmReg.getBridgeByName.mockResolvedValue(mock<LlmBridge>() as unknown as LlmBridge);

    const svc = new SimpleAgentService(llmReg, mcpReg, chatMgr, repo);
    const res = await svc.searchAgents({ name: 'Agent a1' });
    expect(res.items.map((a) => a.id)).toEqual(['a1']);
  });

  it('creates session via materialized agent', async () => {
    const repo = mock<AgentMetadataRepository>();
    const llmReg = mock<LlmBridgeRegistry>();
    const mcpReg = mock<McpRegistry>();
    const chatMgr = mock<ChatManager>();
    const manifestName = 'x';
    const m1 = meta('a1');
    (m1 as any).preset = { llmBridgeName: manifestName, enabledMcps: [] } as any;
    repo.get.mockResolvedValue(m1);
    (repo.getOrThrow as any).mockResolvedValue(m1);
    (repo.getOrThrow as any).mockResolvedValue(m1);
    llmReg.getBridgeByName.mockResolvedValue(mock<LlmBridge>() as unknown as LlmBridge);
    chatMgr.create.mockResolvedValue({ sessionId: 's-1', appendMessage: async () => {}, sumUsage: async () => {} } as any);

    const svc = new SimpleAgentService(llmReg, mcpReg, chatMgr, repo);
    const session = await svc.createSession('a1');
    expect(session.sessionId).toBe('s-1');
  });

  it('delegates execute to agent.chat', async () => {
    const repo = mock<AgentMetadataRepository>();
    const llmReg = mock<LlmBridgeRegistry>();
    const mcpReg = mock<McpRegistry>();
    const chatMgr = mock<ChatManager>();
    const manifestName = 'x';
    const m1 = meta('a1');
    (m1 as any).preset = { llmBridgeName: manifestName, enabledMcps: [] } as any;
    repo.get.mockResolvedValue(m1);
    (repo.getOrThrow as any).mockResolvedValue(m1);
    llmReg.getBridgeByName.mockResolvedValue({ invoke: async () => ({ content: { contentType: 'text', value: 'ok' }, toolCalls: [] }) } as unknown as LlmBridge);
    chatMgr.create.mockResolvedValue({ sessionId: 's-1', appendMessage: async () => {}, sumUsage: async () => {} } as any);
    // Ensure agent.getMetadata returns preset with enabledMcps when called during execute
    const { SimpleAgent } = await import('../simple-agent');
    jest.spyOn(SimpleAgent.prototype as any, 'getMetadata').mockResolvedValue(m1 as any);

    const svc = new SimpleAgentService(llmReg, mcpReg, chatMgr, repo);
    const result = await svc.execute('a1', [], {});
    expect(result.sessionId).toBe('s-1');
    expect(Array.isArray(result.messages)).toBe(true);
  });
});
