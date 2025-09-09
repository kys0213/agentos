import { RpcClient, CloseFn } from '../../shared/rpc/transport';
import type { AgentMetadata, CreateAgentMetadata, AgentStatus, Preset } from '@agentos/core';
import type { UserMessage } from 'llm-bridge-spec';

/**
 * Mock RPC Transport for development mode
 * Simulates RPC communication without actual backend
 */
export class MockRpcTransport implements RpcClient {
  private handlers = new Map<string, (data: unknown) => Promise<unknown>>();
  private mockDelay = 100; // Simulate network delay
  private listeners = new Map<string, Set<(payload: unknown) => void>>();

  constructor() {
    this.setupMockHandlers();
  }

  private setupMockHandlers() {
    // Agent service handlers
    this.handlers.set('agent.get-all-metadatas', async () => {
      return [
        {
          id: 'agent-1',
          name: 'Assistant',
          description: 'General purpose assistant',
          status: 'active',
          icon: '🤖',
          keywords: ['general', 'assistant', 'helpful'],
          preset: {
            id: 'preset-1',
            name: 'Default Assistant',
            description: 'Standard assistant configuration',
            author: 'System',
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0',
            systemPrompt: 'You are a helpful assistant.',
            enabledMcps: ['filesystem'],
            llmBridgeName: 'openai',
            llmBridgeConfig: { model: 'gpt-4' },
            status: 'active',
            usageCount: 25,
            knowledgeDocuments: 0,
            knowledgeStats: {
              indexed: 0,
              vectorized: 0,
              totalSize: 0,
            },
            category: ['general'],
          },
          presetId: 'preset-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sessionCount: 5,
          usageCount: 25,
          lastUsed: new Date().toISOString(),
        },
        {
          id: 'agent-2',
          name: 'Code Helper',
          description: 'Specialized in coding tasks',
          status: 'inactive',
          icon: '💻',
          keywords: ['code', 'programming', 'development'],
          preset: {
            id: 'preset-2',
            name: 'Code Expert',
            description: 'Expert in programming and development',
            author: 'System',
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0',
            systemPrompt: 'You are an expert programmer.',
            enabledMcps: ['filesystem', 'git'],
            llmBridgeName: 'openai',
            llmBridgeConfig: { model: 'gpt-4', temperature: 0.3 },
            status: 'active',
            usageCount: 8,
            knowledgeDocuments: 0,
            knowledgeStats: {
              indexed: 0,
              vectorized: 0,
              totalSize: 0,
            },
            category: ['development'],
          },
          presetId: 'preset-2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sessionCount: 2,
          usageCount: 8,
        },
      ];
    });

    this.handlers.set('agent.create', async (data: unknown) => {
      const input = data as CreateAgentMetadata & {
        presetId?: string;
        status?: AgentStatus;
        icon?: string;
      };
      return {
        id: crypto.randomUUID(),
        name: input.name || 'New Agent',
        description: input.description || '',
        status: input.status || 'active',
        icon: input.icon || '🤖',
        keywords: input.keywords || [],
        preset: {
          id: 'preset-1',
          name: 'Default Assistant',
          description: 'Standard assistant configuration',
          author: 'System',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          systemPrompt: 'You are a helpful assistant.',
          enabledMcps: ['filesystem'],
          llmBridgeName: 'openai',
          llmBridgeConfig: { model: 'gpt-4' },
          status: 'active',
          usageCount: 0,
          knowledgeDocuments: 0,
          knowledgeStats: {
            indexed: 0,
            vectorized: 0,
            totalSize: 0,
          },
          category: ['general'],
        },
        presetId: input.presetId || 'preset-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sessionCount: 0,
        usageCount: 0,
      };
    });

    this.handlers.set('agent.get-metadata', async (data: unknown) => {
      const agentId = data as string;
      return {
        id: agentId,
        name: 'Assistant',
        description: 'General purpose assistant',
        status: 'active',
        icon: '🤖',
        keywords: ['general', 'assistant', 'helpful'],
        preset: {
          id: 'preset-1',
          name: 'Default Assistant',
          description: 'Standard assistant configuration',
          author: 'System',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          systemPrompt: 'You are a helpful assistant.',
          enabledMcps: ['filesystem'],
          llmBridgeName: 'openai',
          llmBridgeConfig: { model: 'gpt-4' },
          status: 'active',
          usageCount: 15,
          knowledgeDocuments: 0,
          knowledgeStats: {
            indexed: 0,
            vectorized: 0,
            totalSize: 0,
          },
          category: ['general'],
        },
        presetId: 'preset-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sessionCount: 3,
        usageCount: 15,
        lastUsed: new Date().toISOString(),
      };
    });

    this.handlers.set('agent.update', async (data: unknown) => {
      const input = data as { agentId: string; patch: Partial<AgentMetadata> };
      return {
        id: input.agentId,
        name: input.patch.name || 'Updated Agent',
        description: input.patch.description || 'Updated description',
        status: (input.patch.status as AgentStatus) || 'active',
        icon: input.patch.icon || '🤖',
        keywords: input.patch.keywords || ['general', 'assistant'],
        preset: {
          id: 'preset-1',
          name: 'Default Assistant',
          description: 'Standard assistant configuration',
          author: 'System',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          systemPrompt: 'You are a helpful assistant.',
          enabledMcps: ['filesystem'],
          llmBridgeName: 'openai',
          llmBridgeConfig: { model: 'gpt-4' },
          status: 'active',
          usageCount: 25,
          knowledgeDocuments: 0,
          knowledgeStats: {
            indexed: 0,
            vectorized: 0,
            totalSize: 0,
          },
          category: ['general'],
        },
        presetId: 'preset-1', // Note: presetId not in AgentMetadata
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        sessionCount: 5,
        usageCount: 25,
      };
    });

    this.handlers.set('agent.delete', async (data: unknown) => {
      const agentId = data as string;
      return {
        id: agentId,
        name: 'Deleted Agent',
        description: 'This agent has been deleted',
        status: 'inactive',
        icon: '❌',
        keywords: ['deleted'],
        preset: {
          id: 'preset-1',
          name: 'Default Assistant',
          description: 'Standard assistant configuration',
          author: 'System',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          systemPrompt: 'You are a helpful assistant.',
          enabledMcps: [],
          llmBridgeName: 'openai',
          llmBridgeConfig: {},
          status: 'inactive',
          usageCount: 0,
          knowledgeDocuments: 0,
          knowledgeStats: {
            indexed: 0,
            vectorized: 0,
            totalSize: 0,
          },
          category: [],
        },
        presetId: 'preset-1',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        sessionCount: 0,
        usageCount: 0,
      };
    });

    this.handlers.set('agent.chat', async (data: unknown) => {
      const input = data as {
        agentId: string;
        messages: UserMessage[];
        options?: { sessionId?: string };
      };
      return {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'Hello! I received your message. This is a mock response.',
              },
            ],
          },
        ],
        sessionId: input.options?.sessionId || crypto.randomUUID(),
      };
    });

    this.handlers.set('agent.end-session', async (_data: unknown) => {
      // No response needed for end-session
      return;
    });

    // Preset service handlers
    this.handlers.set('preset.list', async () => {
      return {
        items: [
          {
            id: 'preset-1',
            name: 'Default Assistant',
          },
          {
            id: 'preset-2',
            name: 'Code Expert',
          },
          {
            id: 'preset-3',
            name: 'Creative Writer',
          },
        ],
        nextCursor: '',
        hasMore: false,
      };
    });

    this.handlers.set('preset.create', async (data: unknown) => {
      const input = data as Partial<Preset>;
      return {
        success: true,
        result: {
          id: crypto.randomUUID(),
          name: input.name || 'New Preset',
          description: input.description || '',
          author: input.author || 'System',
          version: '1.0.0',
          systemPrompt: input.systemPrompt || '',
          enabledMcps: input.enabledMcps || [],
          llmBridgeName: input.llmBridgeName || 'openai',
          llmBridgeConfig: input.llmBridgeConfig || {},
          status: 'active' as const,
          category: input.category || ['general'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    });

    this.handlers.set('preset.get', async (data: unknown) => {
      const presetId = data as string;
      if (presetId === 'preset-1') {
        return {
          id: 'preset-1',
          name: 'Default Assistant',
          description: 'Standard assistant configuration',
          author: 'System',
          version: '1.0.0',
          systemPrompt: 'You are a helpful assistant.',
          enabledMcps: ['filesystem'],
          llmBridgeName: 'openai',
          llmBridgeConfig: { model: 'gpt-4', temperature: 0.7 },
          status: 'active',
          category: ['general'],
          createdAt: new Date(Date.now() - 86400000 * 7),
          updatedAt: new Date(Date.now() - 86400000),
        };
      } else if (presetId === 'preset-2') {
        return {
          id: 'preset-2',
          name: 'Code Expert',
          description: 'Expert in programming and development',
          author: 'System',
          version: '1.0.0',
          systemPrompt: 'You are an expert programmer.',
          enabledMcps: ['filesystem', 'git'],
          llmBridgeName: 'openai',
          llmBridgeConfig: { model: 'gpt-4', temperature: 0.3 },
          status: 'active',
          category: ['development'],
          createdAt: new Date(Date.now() - 86400000 * 5),
          updatedAt: new Date(Date.now() - 86400000),
        };
      }
      return null;
    });

    this.handlers.set('preset.update', async (data: unknown) => {
      const input = data as { id: string; preset: Partial<Preset> };
      return {
        success: true,
        result: {
          id: input.id,
          ...input.preset,
          updatedAt: new Date(),
        },
      };
    });

    this.handlers.set('preset.delete', async (_data: unknown) => {
      return {
        success: true,
      };
    });

    // Chat/Conversation service handlers
    this.handlers.set('chat.list-sessions', async (_pagination?: unknown) => {
      return {
        items: [
          {
            id: 'session-1',
            title: 'Hello World Discussion',
            updatedAt: new Date(),
          },
          {
            id: 'session-2',
            title: 'Code Review Session',
            updatedAt: new Date(Date.now() - 3600000),
          },
          {
            id: 'session-3',
            title: 'Project Planning',
            updatedAt: new Date(Date.now() - 86400000),
          },
        ],
        nextCursor: '',
        hasMore: false,
      };
    });

    this.handlers.set('chat.get-messages', async (_data: unknown) => {
      return {
        items: [
          {
            messageId: 'msg-1',
            createdAt: new Date(Date.now() - 300000),
            role: 'user',
            content: [
              {
                contentType: 'text',
                value: 'Hello! Can you help me with some coding?',
              },
            ],
          },
          {
            messageId: 'msg-2',
            createdAt: new Date(Date.now() - 240000),
            role: 'assistant',
            content: [
              {
                contentType: 'text',
                value:
                  "Of course! I'd be happy to help with coding. What specific programming task or challenge are you working on?",
              },
            ],
          },
          {
            messageId: 'msg-3',
            createdAt: new Date(Date.now() - 180000),
            role: 'user',
            content: [
              {
                contentType: 'text',
                value: 'I need to implement a dark mode for my React app.',
              },
            ],
          },
          {
            messageId: 'msg-4',
            createdAt: new Date(Date.now() - 120000),
            role: 'assistant',
            content: [
              {
                contentType: 'text',
                value:
                  "Great! Here's a comprehensive approach to implementing dark mode in React...",
              },
            ],
          },
        ],
        nextCursor: '',
        hasMore: false,
      };
    });

    this.handlers.set('chat.delete-session', async (_data: unknown) => {
      return {
        success: true,
      };
    });

    // Bridge service handlers
    this.handlers.set('bridge.list', async () => {
      return [
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'openai',
          config: {},
          status: 'connected',
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          type: 'anthropic',
          config: {},
          status: 'disconnected',
        },
      ];
    });

    // MCP service handlers
    this.handlers.set('mcp.list-servers', async () => {
      return [
        {
          id: 'filesystem',
          name: 'Filesystem',
          description: 'Access to local filesystem',
          status: 'active',
        },
        {
          id: 'git',
          name: 'Git',
          description: 'Git repository operations',
          status: 'active',
        },
      ];
    });

    // Model service handlers
    this.handlers.set('model.list', async () => {
      return [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          capabilities: ['chat', 'completion'],
        },
        {
          id: 'claude-3',
          name: 'Claude 3',
          provider: 'anthropic',
          capabilities: ['chat', 'completion'],
        },
      ];
    });
  }

  async request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes> {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const handler = this.handlers.get(channel);
          if (handler) {
            const result = await handler(payload);
            resolve(result as TRes);
          } else {
            reject(new Error(`Method not found: ${channel}`));
          }
        } catch (error) {
          reject(error);
        }
      }, this.mockDelay);
    });
  }

  on<T = unknown>(
    channel: string,
    handler: (payload: T) => void,
    _onError?: (e: unknown) => void
  ): CloseFn {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(handler as (payload: unknown) => void);

    // Return close function
    return async () => {
      const handlers = this.listeners.get(channel);
      if (handlers) {
        handlers.delete(handler as (payload: unknown) => void);
        if (handlers.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  // Emit event to listeners (for testing)
  emit(channel: string, payload: unknown): void {
    const handlers = this.listeners.get(channel);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in handler for channel ${channel}:`, error);
        }
      });
    }
  }
}
