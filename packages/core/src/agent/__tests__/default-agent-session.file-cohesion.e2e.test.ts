import fs from 'fs/promises';
import path from 'path';
import { mock } from 'vitest-mock-extended';
import type { LlmBridge, UserMessage } from 'llm-bridge-spec';
import { DefaultAgentSession } from '../simple-agent-session';
import { McpRegistry } from '../../tool/mcp/mcp.registery';
import { Mcp } from '../../tool/mcp/mcp';
import type { Tool } from '@modelcontextprotocol/sdk/types';
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
            content: [{ contentType: 'text', value: `summary(${messages.length})` }],
          },
          compressedCount: messages.length,
        };
      },
    };
  }

  it('persists user, assistant, tool, assistant messages via storage', async () => {
    const storage = new FileBasedSessionStorage(testDir);
    const mgr = new FileBasedChatManager(storage, noOpCompressor());

    const chatSession = await mgr.create({ sessionId: 's-file-1', agentId: 'a-1' });

    const llm = mock<LlmBridge>();
    // 1st call: tool call
    llm.invoke.mockResolvedValueOnce({
      content: { contentType: 'text', value: 'a1' },
      toolCalls: [{ name: 'dummy.echo', toolCallId: 'tc-1', arguments: { text: 'hi' } }],
    });
    // 2nd call: final assistant
    llm.invoke.mockResolvedValueOnce({
      content: { contentType: 'text', value: 'a2' },
      toolCalls: [],
    });

    class TestMcp extends Mcp {
      constructor() {
        // client/transport are not used in these overridden methods
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error test double
        super({}, {}, { name: 'dummy', version: '1.0.0' } as { name: string; version: string });
      }
      // Avoid accessing base client in tests
      get name() {
        return 'dummy';
      }
      get version() {
        return '1.0.0';
      }
      async getTools(): Promise<Tool[]> {
        const t: Tool = {
          name: 'dummy.echo',
          description: 'echo',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
            },
            required: ['text'],
          },
        };
        return [t];
      }
      async invokeTool(): Promise<{
        isError: boolean;
        contents: Array<{ type: 'text'; text: string }>;
      }> {
        return { isError: false, contents: [{ type: 'text', text: 'tool-result' }] };
      }
    }

    const testMcp = new TestMcp();
    const mcp: McpRegistry = {
      async getAll(): Promise<Mcp[]> {
        return [testMcp];
      },
      async get(name: string) {
        return name === testMcp.name ? testMcp : undefined;
      },
      async getOrThrow(_name: string) {
        return testMcp;
      },
      async getTool(_name: string) {
        const tool: Tool = {
          name: 'dummy.echo',
          description: 'echo',
          inputSchema: {
            type: 'object',
            properties: { text: { type: 'string' } },
            required: ['text'],
          },
        };
        return { mcp: testMcp, tool };
      },
      async getToolOrThrow(name: string) {
        const res = await this.getTool(name);
        if (!res) throw new Error('tool not found');
        return res;
      },
    } as McpRegistry;

    const session = new DefaultAgentSession(chatSession, llm, mcp, meta());

    const user: UserMessage = {
      role: 'user',
      content: [{ contentType: 'text', value: 'hello' }],
    };

    // Auto-accept tool consent
    const off = session.on('consentRequest', async (p) => {
      await session.provideConsentDecision(p.id, true);
    });

    await session.chat([user]);
    off();

    // Inspect in-memory incremental history before commit
    const recent = (await chatSession.getHistories()).items;
    const roles = recent.map((h) => h.role);
    expect(roles).toEqual(['user', 'assistant', 'tool', 'assistant']);

    const toolMsg = recent.find((h) => h.role === 'tool');
    expect(toolMsg).toBeDefined();
    expect(Array.isArray(toolMsg!.content)).toBe(true);
  });
});
