import { mock } from 'vitest-mock-extended';
import type { LlmBridge, LlmBridgeResponse } from 'llm-bridge-spec';
import type { ChatManager } from '../../chat/chat.manager';
import type { ChatSession } from '../../chat/chat-session';
import { McpRegistry } from '../../tool/mcp/mcp.registery';
// removed unused AgentMetadata import
import { SimpleAgent } from '../simple-agent';
import { AgentMetadataRepository } from '../agent-metadata.repository';

// meta() was unused; removed to keep tests minimal

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

    await agent.createSession();
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
