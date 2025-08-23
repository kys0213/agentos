import { mock } from 'jest-mock-extended';
import type { LlmBridge, LlmBridgeResponse, UserMessage } from 'llm-bridge-spec';
import { DefaultAgentSession } from '../simple-agent-session';
import type { ChatSession, MessageHistory } from '../../chat/chat-session';
import type { AgentMetadata } from '../agent-metadata';
import { ChatSessionMetadata } from '../../chat/chat-session-metata';

function createChatSession(sessionId = 's-t1'): ChatSession {
  const messages: MessageHistory[] = [];
  return {
    agentId: 'a-1',
    sessionId,
    async appendMessage(message) {
      const history: MessageHistory = {
        ...message,
        messageId: String(messages.length + 1),
        createdAt: new Date(),
      } as MessageHistory;
      messages.push(history);
      return history;
    },
    async sumUsage() {
      // no-op for tests
    },
    async getHistories() {
      return { items: messages, nextCursor: '', hasMore: false };
    },
    async getCheckpoints() {
      return { items: [], nextCursor: '', hasMore: false };
    },
    async getMetadata(): Promise<ChatSessionMetadata> {
      return {
        sessionId,
        agentId: 'a-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: '',
        totalMessages: messages.length,
        totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        recentMessages: messages,
        joinedAgents: [],
      };
    },
    async commit() {},
  };
}

function createMeta(): AgentMetadata {
  return {
    id: 'a-t1',
    name: 'Agent',
    description: '',
    icon: '',
    keywords: [],
    preset: {
      id: 'p-1',
      name: 'preset',
      description: '',
      author: '',
      createdAt: new Date(),
      updatedAt: new Date(),
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
    },
    sessionCount: 0,
    lastUsed: new Date(),
    status: 'active',
    usageCount: 0,
  };
}

describe('DefaultAgentSession interactions', () => {
  test('abort signal terminates chat and emits status', async () => {
    const llm = mock<LlmBridge>();
    // Deferred resolution
    let resolveFn: (v: LlmBridgeResponse) => void;
    const deferred = new Promise<LlmBridgeResponse>((resolve) => (resolveFn = resolve));
    llm.invoke.mockReturnValue(deferred);

    const chat = createChatSession('s-abort');
    const mcp = { getAll: jest.fn().mockResolvedValue([]) } as any;
    const agent = new DefaultAgentSession(chat, llm, mcp, createMeta());

    const ac = new AbortController();
    const statusEvents: string[] = [];
    agent.on('status', (p) => statusEvents.push(p.state));

    const run = agent.chat(
      [{ role: 'user', content: [{ contentType: 'text', value: 'hi' }] } as UserMessage],
      { abortSignal: ac.signal }
    );

    // Abort before llm resolves
    ac.abort();
    // Now resolve LLM to let the pipeline proceed and hit abort check
    resolveFn!({ content: { contentType: 'text', value: 'ok' }, toolCalls: [] } as any);

    await expect(run).rejects.toThrow('stopped by abort signal');
    expect(statusEvents).toContain('terminated');
  });

  test('timeout rejects with error and emits error event', async () => {
    const llm = mock<LlmBridge>();
    // LLM never resolves within timeout
    llm.invoke.mockImplementation(() => new Promise<LlmBridgeResponse>(() => {}));

    const chat = createChatSession('s-timeout');
    const mcp = { getAll: jest.fn().mockResolvedValue([]) } as any;
    const agent = new DefaultAgentSession(chat, llm, mcp, createMeta());

    const errors: Error[] = [];
    agent.on('error', (e) => errors.push(e.error));

    const run = agent.chat(
      [{ role: 'user', content: [{ contentType: 'text', value: 'hi' }] } as UserMessage],
      { timeout: 5 }
    );

    await expect(run).rejects.toThrow('timeout');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('timeout');
  });

  test('llm error propagates and emits error event', async () => {
    const llm = mock<LlmBridge>();
    llm.invoke.mockRejectedValue(new Error('boom'));

    const chat = createChatSession('s-error');
    const mcp = { getAll: jest.fn().mockResolvedValue([]) } as any;
    const agent = new DefaultAgentSession(chat, llm, mcp, createMeta());

    const errors: Error[] = [];
    agent.on('error', (e) => errors.push(e.error));

    await expect(
      agent.chat([{ role: 'user', content: [{ contentType: 'text', value: 'hi' }] } as UserMessage])
    ).rejects.toThrow('boom');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('boom');
  });
});
