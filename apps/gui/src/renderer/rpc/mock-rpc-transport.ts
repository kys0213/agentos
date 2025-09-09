import { RpcClient, CloseFn } from '../../shared/rpc/transport';

/**
 * Mock RPC Transport for development mode
 * Simulates RPC communication without actual backend
 */
export class MockRpcTransport implements RpcClient {
  private handlers = new Map<string, (data: any) => Promise<any>>();
  private mockDelay = 100; // Simulate network delay
  private listeners = new Map<string, Set<(payload: any) => void>>();

  constructor() {
    this.setupMockHandlers();
  }

  private setupMockHandlers() {
    // Agent service handlers
    this.handlers.set('AgentService.List', async () => {
      return {
        agents: [
          {
            id: 'agent-1',
            name: 'Assistant',
            description: 'General purpose assistant',
            status: 'active',
            presetId: 'preset-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'agent-2',
            name: 'Code Helper',
            description: 'Specialized in coding tasks',
            status: 'inactive',
            presetId: 'preset-2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });

    this.handlers.set('AgentService.Create', async (data: any) => {
      return {
        agent: {
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    this.handlers.set('AgentService.Get', async (data: any) => {
      return {
        agent: {
          id: data.id,
          name: 'Assistant',
          description: 'General purpose assistant',
          status: 'active',
          presetId: 'preset-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    // Preset service handlers
    this.handlers.set('PresetService.List', async () => {
      return {
        presets: [
          {
            id: 'preset-1',
            name: 'Default Assistant',
            description: 'Standard assistant configuration',
            instructions: 'You are a helpful assistant.',
            model: 'gpt-4',
            temperature: 0.7,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'preset-2',
            name: 'Code Expert',
            description: 'Expert in programming and development',
            instructions: 'You are an expert programmer.',
            model: 'gpt-4',
            temperature: 0.3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });

    this.handlers.set('PresetService.Create', async (data: any) => {
      return {
        preset: {
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    this.handlers.set('PresetService.Get', async (data: any) => {
      return {
        preset: {
          id: data.id,
          name: 'Default Assistant',
          description: 'Standard assistant configuration',
          instructions: 'You are a helpful assistant.',
          model: 'gpt-4',
          temperature: 0.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    // Chat/Conversation service handlers
    this.handlers.set('ChatService.ListSessions', async () => {
      return {
        sessions: [
          {
            id: 'session-1',
            title: 'Hello World Discussion',
            agentId: 'agent-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            messageCount: 5,
          },
        ],
      };
    });

    this.handlers.set('ChatService.CreateSession', async (data: any) => {
      return {
        session: {
          id: crypto.randomUUID(),
          title: data.title || 'New Chat',
          agentId: data.agentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        },
      };
    });

    this.handlers.set('ChatService.GetSession', async (data: any) => {
      return {
        session: {
          id: data.sessionId,
          title: 'Hello World Discussion',
          agentId: 'agent-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          messageCount: 5,
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello!',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Hello! How can I help you today?',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      };
    });

    // Bridge service handlers
    this.handlers.set('BridgeService.List', async () => {
      return {
        bridges: [
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
        ],
      };
    });

    // MCP service handlers
    this.handlers.set('McpService.ListServers', async () => {
      return {
        servers: [
          {
            id: 'filesystem',
            name: 'Filesystem',
            description: 'Access to local filesystem',
            status: 'active',
          },
        ],
      };
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
    onError?: (e: unknown) => void
  ): CloseFn {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(handler);

    // Return close function
    return async () => {
      const handlers = this.listeners.get(channel);
      if (handlers) {
        handlers.delete(handler);
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
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in handler for channel ${channel}:`, error);
        }
      });
    }
  }
}