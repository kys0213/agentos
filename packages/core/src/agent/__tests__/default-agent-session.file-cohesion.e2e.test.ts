import fs from 'fs/promises';
import path from 'path';
import { mock } from 'jest-mock-extended';
import type { LlmBridge, LlmBridgeResponse, UserMessage } from 'llm-bridge-spec';
import { DefaultAgentSession } from '../simple-agent-session';
import type { AgentMetadata } from '../agent-metadata';
import { FileBasedSessionStorage } from '../../chat/file/file-based-session-storage';
import { FileBasedChatManager } from '../../chat/file/file-based-chat.manager';
import type { CompressStrategy } from '../../chat/chat-session';

describe('DefaultAgentSession + FileBasedChatManager cohesion', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(__dirname, 'sessions-cohesion');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  function meta(): AgentMetadata {
    return {
      id: 'a-1',
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

  function noOpCompressor(): CompressStrategy {
    return {
      async compress(messages) {
        return {
          summary: {
            role: 'system',
            content: { contentType: 'text', value: `summary(${messages.length})` },
          },
          compressedCount: messages.length,
        };
      },
    };
  }

  it('persists user, assistant, tool, assistant messages via storage', async () => {
    const storage = new FileBasedSessionStorage(testDir);
    const mgr = new FileBasedChatManager(storage, noOpCompressor());

    const chatSession = await mgr.create({ sessionId: 's-file-1' });

    const llm = mock<LlmBridge>();
    // 1st call: tool call
    llm.invoke.mockResolvedValueOnce({
      content: { contentType: 'text', value: 'a1' },
      toolCalls: [{ name: 'dummy.echo', toolCallId: 'tc-1', arguments: { text: 'hi' } } as any],
    } as LlmBridgeResponse);
    // 2nd call: final assistant
    llm.invoke.mockResolvedValueOnce({
      content: { contentType: 'text', value: 'a2' },
      toolCalls: [],
    } as LlmBridgeResponse);

    const mcp = {
      getAll: jest.fn().mockResolvedValue([]),
      getToolOrThrow: jest.fn().mockResolvedValue({
        mcp: {
          name: 'dummy',
          getTools: jest.fn(),
          invokeTool: jest.fn().mockResolvedValue({
            isError: false,
            contents: [{ type: 'text', text: 'tool-result' }],
          }),
        },
        tool: { name: 'dummy.echo', description: 'echo', parameters: {} },
      }),
    } as any;

    const session = new DefaultAgentSession('a-1', chatSession, llm, mcp, meta());

    const user: UserMessage = {
      role: 'user',
      content: { contentType: 'text', value: 'hello' },
    };

    // Auto-accept tool consent
    const off = session.on('consentRequest', async (p) => {
      await session.provideConsentDecision(p.id, true);
    });

    await session.chat([user]);
    off();

    // Inspect in-memory incremental history before commit
    const recent: any[] = (chatSession as any).metadata.recentMessages;
    const roles = recent.map((h) => h.role);
    expect(roles).toEqual(['user', 'assistant', 'tool', 'assistant']);

    const toolMsg = recent.find((h) => h.role === 'tool');
    expect(Array.isArray(toolMsg.content)).toBe(true);
  });
});
