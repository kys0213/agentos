import { mock } from 'vitest-mock-extended';
import type { ReadonlyAgentMetadata } from '../agent-metadata';
import { SimpleAgentService } from '../simple-agent.service';
import { LlmBridgeRegistry } from '../../llm/bridge/registry';
import type { LlmBridge } from 'llm-bridge-spec';
import { McpRegistry } from '../../tool/mcp/mcp.registery';
import type { ChatManager } from '../../chat/chat.manager';
import type { AgentMetadataRepository } from '../agent-metadata.repository';
import type { ReadonlyPreset, Preset } from '../../preset/preset';
import type { AgentStatus } from '../agent';
import type { ChatSession } from '../../chat/chat-session';

// Removed unused FakeSession type helper

// Removed unused FakeAgent to satisfy strict lint rules

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
    repo.get.mockImplementation(async (id: string) => {
      if (id === 'a1') {
        return m1;
      }
      if (id === 'a2') {
        return m2;
      }
      return null;
    });
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
    const result = await svc.execute(
      'a1',
      [{ role: 'user', content: [{ contentType: 'text', value: 'hi' }] }],
      {}
    );
    expect(result.sessionId).toBe('s-1');
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.role).toBe('assistant');
  });
});
