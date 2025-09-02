import { mock } from 'vitest-mock-extended';
import type { LlmBridge, UserMessage, LlmBridgeResponse } from 'llm-bridge-spec';
import { SimpleAgent } from '../simple-agent';
import { McpRegistry } from '../../tool/mcp/mcp.registery';
import { ChatManager } from '../../chat/chat.manager';
import type { ChatSession } from '../../chat/chat-session';
import type { AgentMetadata } from '../agent-metadata';
import { AgentMetadataRepository } from '../agent-metadata.repository';

describe('SimpleAgent.createSession', () => {
  it('creates a session and supports chat via AgentSession', async () => {
    const llm = mock<LlmBridge>();
    const mcp = mock<McpRegistry>();
    const chatManager = mock<ChatManager>();
    const chatSession = mock<ChatSession>();

    chatSession.sessionId = 's-1';
    chatManager.create.mockResolvedValue(chatSession);
    chatManager.getSession.mockResolvedValue(chatSession);

    const meta: AgentMetadata = {
      id: 'a-1',
      name: 'Agent 1',
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

    // MCP registry getAll은 빈 배열 반환으로 설정(툴 없는 환경)
    mcp.getAll.mockResolvedValue([]);

    const repo = mock<AgentMetadataRepository>();
    repo.getOrThrow.mockResolvedValue(meta);
    const agent = new SimpleAgent('a-1', llm, mcp, chatManager, repo);

    // LLM 응답 목업
    const resp: LlmBridgeResponse = {
      content: { contentType: 'text', value: 'hi' },
      toolCalls: [],
    };
    llm.invoke.mockResolvedValue(resp);

    const session = await agent.createSession();
    expect(session.sessionId).toBe('s-1');

    const messages: UserMessage[] = [
      { role: 'user', content: [{ contentType: 'text', value: 'hello' }] },
    ];
    const events: Array<['status', string] | ['message', string]> = [];
    const offStatus = session.on('status', (p) => events.push(['status', p.state]));
    const offMsg = session.on('message', (p) => events.push(['message', p.message.role]));

    const result = await session.chat(messages);
    // 기본 구현은 history 조회 실패 시 빈 배열을 반환
    expect(Array.isArray(result)).toBe(true);
    // 이벤트가 최소 한 번은 발생해야 함 (running/idle)
    expect(events.some(([t]) => t === 'status')).toBe(true);

    offStatus();
    offMsg();
  });
});
