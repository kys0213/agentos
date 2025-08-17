import type { Agent, AgentExecuteOptions, AgentChatResult } from '../agent';
import type { AgentSession } from '../agent-session';
import type { ReadonlyAgentMetadata } from '../agent-metadata';
import type { AgentManager } from '../agent-manager';
import { SimpleAgentService } from '../simple-agent.service';
import type { CursorPaginationResult } from '../../common/pagination/cursor-pagination';

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

class FakeManager implements AgentManager {
  private map = new Map<string, Agent>();
  constructor(agents: Agent[] = []) {
    agents.forEach((a) => this.map.set(a.id, a));
  }
  async register(a: Agent): Promise<void> {
    this.map.set(a.id, a);
  }
  async unregister(id: string): Promise<void> {
    this.map.delete(id);
  }
  async getAgent(id: string): Promise<Agent | null> {
    return this.map.get(id) ?? null;
  }
  async getAllAgents(): Promise<CursorPaginationResult<Agent>> {
    return { items: Array.from(this.map.values()), nextCursor: '', hasMore: false };
  }
  async getAvailableAgents(): Promise<CursorPaginationResult<Agent>> {
    return { items: Array.from(this.map.values()), nextCursor: '', hasMore: false };
  }
  async getActiveAgents(): Promise<CursorPaginationResult<Agent>> {
    return { items: Array.from(this.map.values()), nextCursor: '', hasMore: false };
  }
  async createAgentSession(agentId: string): Promise<AgentSession> {
    const a = this.map.get(agentId)!;
    return a.createSession();
  }
  async execute(agentId: string): Promise<AgentChatResult> {
    const a = this.map.get(agentId)!;
    return a.chat([] as any, {} as AgentExecuteOptions);
  }
  async getAgentStatus(): Promise<any> {
    return 'active';
  }
  async endAgentSession(): Promise<void> {}
  async terminateAgentSession(): Promise<void> {}
  async getStats(): Promise<any> {
    return { totalAgents: this.map.size, agentsByStatus: {} as any, totalActiveSessions: 0 };
  }
  async searchAgents(): Promise<CursorPaginationResult<Agent>> {
    return { items: Array.from(this.map.values()), nextCursor: '', hasMore: false };
  }
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
    const a1 = new FakeAgent('a1', meta('a1'));
    const a2 = new FakeAgent('a2', meta('a2'));
    const svc = new SimpleAgentService(new FakeManager([a1, a2]));
    const list = await svc.listAgents();
    expect(list.items.map((a) => a.id)).toEqual(['a1', 'a2']);
    const got = await svc.getAgent('a2');
    expect(got?.id).toBe('a2');
  });

  it('searches via fallback metadata filtering', async () => {
    const a1 = new FakeAgent('a1', meta('a1'));
    const a2 = new FakeAgent('a2', meta('a2'));
    const svc = new SimpleAgentService(new FakeManager([a1, a2]));
    const res = await svc.searchAgents({ name: 'Agent a1' });
    expect(res.items.map((a) => a.id)).toEqual(['a1']);
  });

  it('creates session via manager agent', async () => {
    const a1 = new FakeAgent('a1', meta('a1'));
    const svc = new SimpleAgentService(new FakeManager([a1]));
    const session = await svc.createSession('a1');
    expect(session.sessionId).toBe('s-1');
  });

  it('delegates execute to manager', async () => {
    const a1 = new FakeAgent('a1', meta('a1'));
    const mgr = new FakeManager([a1]);
    const svc = new SimpleAgentService(mgr);
    const result = await svc.execute('a1', [] as any, {} as any);
    expect(result).toEqual({ messages: [], sessionId: 's-1' });
  });
});
