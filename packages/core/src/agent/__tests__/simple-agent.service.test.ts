import { mock } from 'jest-mock-extended';
import type { Agent, AgentChatResult } from '../agent';
import type { AgentMetadata, ReadonlyAgentMetadata } from '../agent-metadata';
import type { AgentSession } from '../agent-session';
import { SimpleAgentService } from '../simple-agent.service';
import { LlmBridgeRegistry } from '../../llm/bridge/registry';
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
    const a1 = new FakeAgent('a1', meta('a1'));
    const a2 = new FakeAgent('a2', meta('a2'));
    const svc = new SimpleAgentService(
      mock<LlmBridgeRegistry>(),
      mock<McpRegistry>(),
      mock<ChatManager>(),
      mock<AgentMetadataRepository>()
    );
    const list = await svc.listAgents();
    expect(list.items.map((a) => a.id)).toEqual(['a1', 'a2']);
    const got = await svc.getAgent('a2');
    expect(got?.id).toBe('a2');
  });

  it('searches via fallback metadata filtering', async () => {
    const a1 = new FakeAgent('a1', meta('a1'));
    const a2 = new FakeAgent('a2', meta('a2'));
    const svc = new SimpleAgentService(
      mock<LlmBridgeRegistry>(),
      mock<McpRegistry>(),
      mock<ChatManager>(),
      mock<AgentMetadataRepository>()
    );
    const res = await svc.searchAgents({ name: 'Agent a1' });
    expect(res.items.map((a) => a.id)).toEqual(['a1']);
  });

  it('creates session via manager agent', async () => {
    const a1 = new FakeAgent('a1', meta('a1'));
    const svc = new SimpleAgentService(
      mock<LlmBridgeRegistry>(),
      mock<McpRegistry>(),
      mock<ChatManager>(),
      mock<AgentMetadataRepository>()
    );
    const session = await svc.createSession('a1');
    expect(session.sessionId).toBe('s-1');
  });

  it('delegates execute to manager', async () => {
    const a1 = new FakeAgent('a1', meta('a1'));
    const svc = new SimpleAgentService(
      mock<LlmBridgeRegistry>(),
      mock<McpRegistry>(),
      mock<ChatManager>(),
      mock<AgentMetadataRepository>()
    );
    const result = await svc.execute('a1', [], {});
    expect(result).toEqual({ messages: [], sessionId: 's-1' });
  });
});
