import { McpRegistry } from '../mcp-registry';
import { McpToolRepository, McpToolRepositoryEventPayload } from '../../repository/mcp-tool-repository';
import { McpToolMetadata, McpConnectionStatus } from '../../mcp-types';
import { McpConfig } from '../../mcp-config';
import { CursorPagination, CursorPaginationResult } from '../../../../common/pagination/cursor-pagination';

// Mock Repository 구현
class MockMcpToolRepository implements McpToolRepository {
  private tools = new Map<string, McpToolMetadata>();
  private eventHandlers = new Map<string, ((payload: McpToolRepositoryEventPayload) => void)[]>();

  async get(id: string): Promise<McpToolMetadata | null> {
    return this.tools.get(id) || null;
  }

  async list(pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>> {
    const items = Array.from(this.tools.values());
    return {
      items,
      nextCursor: '',
      hasMore: false
    };
  }

  async search(): Promise<CursorPaginationResult<McpToolMetadata>> {
    return this.list();
  }

  async create(config: McpConfig): Promise<McpToolMetadata> {
    const tool: McpToolMetadata = {
      id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: `MCP Tool: ${config.name}`,
      version: config.version,
      category: 'general',
      provider: 'Test Provider',
      status: 'disconnected',
      usageCount: 0,
      permissions: [],
      config: {}
    };

    this.tools.set(tool.id, tool);
    this.emit('changed', { id: tool.id, metadata: tool });
    
    return tool;
  }

  async update(
    id: string,
    patch: Partial<McpToolMetadata>,
    options?: { expectedVersion?: string }
  ): Promise<McpToolMetadata> {
    const existing = this.tools.get(id);
    if (!existing) {
      throw new Error(`Tool not found: ${id}`);
    }

    if (options?.expectedVersion && existing.version !== options.expectedVersion) {
      throw new Error(`Version conflict for tool ${id}`);
    }

    const previousStatus = existing.status;
    const updated: McpToolMetadata = {
      ...existing,
      ...patch,
      id, // ID는 변경 불가
      version: `v${Date.now()}` // 새 버전 할당
    };

    this.tools.set(id, updated);
    this.emit('changed', { id, metadata: updated });

    if (previousStatus !== updated.status) {
      this.emit('statusChanged', { id, metadata: updated, previousStatus });
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.tools.has(id)) {
      throw new Error(`Tool not found: ${id}`);
    }

    this.tools.delete(id);
    this.emit('deleted', { id });
  }

  on(event: 'changed' | 'deleted' | 'statusChanged', handler: (payload: McpToolRepositoryEventPayload) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(handler);
    
    return () => {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    };
  }

  private emit(event: string, payload: McpToolRepositoryEventPayload): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(payload));
  }
}

describe('McpRegistry', () => {
  let registry: McpRegistry;
  let mockRepository: MockMcpToolRepository;

  beforeEach(async () => {
    mockRepository = new MockMcpToolRepository();
    registry = new McpRegistry(mockRepository);
    await registry.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newRegistry = new McpRegistry(mockRepository);
      await expect(newRegistry.initialize()).resolves.toBeUndefined();
    });

    it('should load existing tools from repository on initialization', async () => {
      // Repository에 도구 미리 생성
      const config: McpConfig = {
        type: 'stdio',
        name: 'existing-tool',
        version: '1.0.0',
        command: 'node'
      };
      await mockRepository.create(config);

      // 새 레지스트리 인스턴스로 초기화
      const newRegistry = new McpRegistry(mockRepository);
      await newRegistry.initialize();

      expect(newRegistry.totalToolsCount).toBe(1);
    });
  });

  describe('tool registration', () => {
    it('should register a new tool', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      const tool = await registry.registerTool(config);

      expect(tool.name).toBe('test-tool');
      expect(tool.status).toBe('disconnected');
      expect(registry.getTool(tool.id)).toEqual(tool);
      expect(registry.totalToolsCount).toBe(1);
    });

    it('should emit toolAdded event on registration', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      const eventPromise = new Promise((resolve) => {
        registry.on('toolAdded', resolve);
      });

      const tool = await registry.registerTool(config);
      const event = await eventPromise;

      expect(event).toEqual({ tool });
    });
  });

  describe('tool unregistration', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await registry.registerTool(config);
      toolId = tool.id;
    });

    it('should unregister an existing tool', async () => {
      await registry.unregisterTool(toolId);

      expect(registry.getTool(toolId)).toBeNull();
      expect(registry.totalToolsCount).toBe(0);
    });

    it('should emit toolRemoved event on unregistration', async () => {
      const eventPromise = new Promise((resolve) => {
        registry.on('toolRemoved', resolve);
      });

      await registry.unregisterTool(toolId);
      const event = await eventPromise;

      expect(event).toEqual({ toolId });
    });
  });

  describe('tool updates', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await registry.registerTool(config);
      toolId = tool.id;
    });

    it('should update tool metadata', async () => {
      const patch = { description: 'Updated description' };
      const updated = await registry.updateTool(toolId, patch);

      expect(updated.description).toBe('Updated description');
      expect(registry.getTool(toolId)?.description).toBe('Updated description');
    });

    it('should emit toolUpdated event on update', async () => {
      const eventPromise = new Promise((resolve) => {
        registry.on('toolUpdated', resolve);
      });

      const patch = { description: 'Updated description' };
      const updated = await registry.updateTool(toolId, patch);
      const event = await eventPromise;

      expect(event).toMatchObject({
        tool: updated,
        previousVersion: expect.any(String)
      });
    });
  });

  describe('connection status management', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await registry.registerTool(config);
      toolId = tool.id;
    });

    it('should update connection status', async () => {
      await registry.updateConnectionStatus(toolId, 'connected');

      const tool = registry.getTool(toolId);
      expect(tool?.status).toBe('connected');
      expect(registry.connectedToolsCount).toBe(1);
    });

    it('should emit connectionStatusChanged event', async () => {
      const eventPromise = new Promise((resolve) => {
        registry.on('connectionStatusChanged', resolve);
      });

      await registry.updateConnectionStatus(toolId, 'connected');
      const event = await eventPromise;

      expect(event).toEqual({
        toolId,
        status: 'connected',
        previousStatus: 'disconnected'
      });
    });

    it('should not emit event if status is unchanged', async () => {
      let eventEmitted = false;
      registry.on('connectionStatusChanged', () => {
        eventEmitted = true;
      });

      await registry.updateConnectionStatus(toolId, 'disconnected');
      
      expect(eventEmitted).toBe(false);
    });
  });

  describe('usage tracking', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await registry.registerTool(config);
      toolId = tool.id;
    });

    it('should increment usage count', async () => {
      await registry.incrementUsage(toolId);

      const tool = registry.getTool(toolId);
      expect(tool?.usageCount).toBe(1);
      expect(tool?.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent tool', async () => {
      await expect(registry.incrementUsage('non-existent')).rejects.toThrow(/not found in registry/);
    });
  });

  describe('querying', () => {
    beforeEach(async () => {
      // 여러 도구 생성
      const configs: McpConfig[] = [
        { type: 'stdio', name: 'search-tool', version: '1.0.0', command: 'node' },
        { type: 'streamableHttp', name: 'api-tool', version: '1.0.0', url: 'https://api.example.com' },
        { type: 'stdio', name: 'dev-tool', version: '1.0.0', command: 'python' }
      ];

      for (const config of configs) {
        const tool = await registry.registerTool(config);
        
        // 일부 도구 연결 상태 변경
        if (config.name === 'search-tool') {
          await registry.updateConnectionStatus(tool.id, 'connected');
        }
      }
    });

    it('should get all tools', () => {
      const result = registry.getAllTools();
      
      expect(result.items).toHaveLength(3);
      expect(result.hasMore).toBe(false);
    });

    it('should support pagination', () => {
      const result = registry.getAllTools({ cursor: '', limit: 2, direction: 'forward' });
      
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });

    it('should filter tools by status', () => {
      const connectedTools = registry.getToolsByStatus('connected');
      const disconnectedTools = registry.getToolsByStatus('disconnected');
      
      expect(connectedTools).toHaveLength(1);
      expect(disconnectedTools).toHaveLength(2);
    });

    it('should filter tools by category', () => {
      const generalTools = registry.getToolsByCategory('general');
      
      expect(generalTools).toHaveLength(3);
    });

    it('should track counts correctly', () => {
      expect(registry.totalToolsCount).toBe(3);
      expect(registry.connectedToolsCount).toBe(1);
    });
  });
});