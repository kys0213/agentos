import { mock } from 'vitest-mock-extended';
import type { LlmBridge, LlmBridgeResponse } from 'llm-bridge-spec';
import type { ChatManager } from '../../chat/chat.manager';
import type { ChatSession } from '../../chat/chat-session';
import { McpRegistry } from '../../tool/mcp/mcp.registery';
import type { AgentMetadata } from '../agent-metadata';
import { SimpleAgent } from '../simple-agent';
import { AgentMetadataRepository } from '../agent-metadata.repository';

function meta(): AgentMetadata {
  return {
    id: 'a-evt',
    name: 'Agent',
    description: '',
    icon: '',
    keywords: [],
    preset: {
      id: 'p-1',
      name: 'p',
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

describe('SimpleAgent events', () => {
  it('emits sessionCreated/sessionEnded and status changes', async () => {
    const llm = mock<LlmBridge>();
    const mcp = mock<McpRegistry>();
    const chatManager = mock<ChatManager>();
    const chatSession = mock<ChatSession>();
    chatSession.sessionId = 's-evt';
    chatManager.create.mockResolvedValue(chatSession);
    chatManager.getSession.mockResolvedValue(chatSession);

    // minimal llm response
    const resp: LlmBridgeResponse = {
      content: { contentType: 'text', value: 'ok' },
      toolCalls: [],
    };
    llm.invoke.mockResolvedValue(resp);

    const agent = new SimpleAgent('a-evt', llm, mcp, chatManager, mock<AgentMetadataRepository>());

    const events: AgentEvent[] = [];
    const off = agent.on((e) => events.push(e));

    const session = await agent.createSession();
    expect(events.some((e) => e.type === 'sessionCreated' && e.sessionId === 's-evt')).toBe(true);

    await agent.endSession('s-evt');
    expect(events.some((e) => e.type === 'sessionEnded' && e.sessionId === 's-evt')).toBe(true);

    await agent.idle();
    await agent.activate();
    await agent.inactive();
    expect(events.some((e) => e.type === 'statusChanged' && e.status === 'idle')).toBe(true);
    expect(events.some((e) => e.type === 'statusChanged' && e.status === 'active')).toBe(true);
    expect(events.some((e) => e.type === 'statusChanged' && e.status === 'inactive')).toBe(true);

    off();
  });
});
import type { AgentEvent } from '../agent-events';
