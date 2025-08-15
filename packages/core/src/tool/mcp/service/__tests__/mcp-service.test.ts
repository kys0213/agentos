import { McpService } from '../mcp-service';
import { McpToolRepository, McpToolRepositoryEventPayload } from '../../repository/mcp-tool-repository';
import { McpRegistry } from '../../registry/mcp-registry';
import { McpToolMetadata, McpConnectionStatus } from '../../mcp-types';
import { McpConfig } from '../../mcp-config';
import { CursorPagination, CursorPaginationResult } from '../../../../common/pagination/cursor-pagination';

// Mock Repository
class MockMcpToolRepository implements McpToolRepository {
  private tools = new Map<string, McpToolMetadata>();
  private eventHandlers = new Map<string, ((payload: McpToolRepositoryEventPayload) => void)[]>();

  async get(id: string): Promise<McpToolMetadata | null> {
    return this.tools.get(id) || null;
  }

  async list(): Promise<CursorPaginationResult<McpToolMetadata>> {
    return {
      items: Array.from(this.tools.values()),
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
    patch: Partial<McpToolMetadata>
  ): Promise<McpToolMetadata> {
    const existing = this.tools.get(id);
    if (!existing) {
      throw new Error(`Tool not found: ${id}`);
    }

    const updated: McpToolMetadata = {
      ...existing,
      ...patch,
      id,
      version: `v${Date.now()}`
    };

    this.tools.set(id, updated);
    this.emit('changed', { id, metadata: updated });
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.tools.has(id)) {
      throw new Error(`Tool not found: ${id}`);
    }
    this.tools.delete(id);
    this.emit('deleted', { id });
  }

  on(event: string, handler: (payload: McpToolRepositoryEventPayload) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    return () => {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    };
  }

  private emit(event: string, payload: McpToolRepositoryEventPayload): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(payload));
  }
}

describe('McpService', () => {
  let service: McpService;
  let mockRepository: MockMcpToolRepository;
  let mockRegistry: McpRegistry;

  beforeEach(async () => {
    mockRepository = new MockMcpToolRepository();
    mockRegistry = new McpRegistry(mockRepository);
    service = new McpService(mockRepository, mockRegistry);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
    });

    it('should emit serviceInitialized event', async () => {
      const eventPromise = new Promise((resolve) => {
        service.on('serviceInitialized', resolve);
      });

      await service.initialize();
      const event = await eventPromise;

      expect(event).toEqual({ totalTools: 0 });
    });

    it('should emit operation events during initialization', async () => {
      const events: any[] = [];
      service.on('operationStarted', (e) => events.push({ type: 'started', ...e }));
      service.on('operationCompleted', (e) => events.push({ type: 'completed', ...e }));

      await service.initialize();

      expect(events).toEqual([
        { type: 'started', operation: 'initialize' },
        { type: 'completed', operation: 'initialize', success: true }
      ]);
    });

    it('should not initialize twice', async () => {
      await service.initialize();
      
      // 두 번째 호출은 아무것도 하지 않아야 함
      await expect(service.initialize()).resolves.toBeUndefined();
    });

    it('should throw error before initialization', () => {
      expect(() => service.getTool('any-id')).toThrow(/not initialized/);
    });
  });

  describe('tool registration', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should register a valid tool', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      const tool = await service.registerTool(config);

      expect(tool.name).toBe('test-tool');
      expect(tool.status).toBe('disconnected');
      expect(service.getTool(tool.id)).toEqual(tool);
    });

    it('should validate tool configuration', async () => {
      const invalidConfigs = [
        { type: 'stdio', name: '', version: '1.0.0', command: 'node' }, // empty name
        { type: 'stdio', name: 'test', version: '', command: 'node' }, // empty version
        { type: 'stdio', name: 'test', version: '1.0.0', command: '' }, // empty command
        { type: 'streamableHttp', name: 'test', version: '1.0.0', url: '' }, // empty URL
        { type: 'streamableHttp', name: 'test', version: '1.0.0', url: 'invalid-url' }, // invalid URL
      ];

      for (const config of invalidConfigs) {
        await expect(service.registerTool(config as McpConfig)).rejects.toThrow();
      }
    });

    it('should emit operation events during registration', async () => {
      const events: any[] = [];
      service.on('operationStarted', (e) => events.push({ type: 'started', ...e }));
      service.on('operationCompleted', (e) => events.push({ type: 'completed', ...e }));

      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      const tool = await service.registerTool(config);

      expect(events).toEqual([
        { type: 'started', operation: 'registerTool' },
        { type: 'completed', operation: 'registerTool', toolId: tool.id, success: true }
      ]);
    });

    it('should forward registry events', async () => {
      const toolAddedEvent = new Promise((resolve) => {
        service.on('toolAdded', resolve);
      });

      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      const tool = await service.registerTool(config);
      const event = await toolAddedEvent;

      expect(event).toEqual({ tool });
    });
  });

  describe('tool unregistration', () => {
    let toolId: string;

    beforeEach(async () => {
      await service.initialize();
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await service.registerTool(config);
      toolId = tool.id;
    });

    it('should unregister existing tool', async () => {
      await service.unregisterTool(toolId);
      expect(service.getTool(toolId)).toBeNull();
    });

    it('should throw error for non-existent tool', async () => {
      await expect(service.unregisterTool('non-existent')).rejects.toThrow(/not found/);
    });

    it('should emit operation events during unregistration', async () => {
      const events: any[] = [];
      service.on('operationStarted', (e) => events.push({ type: 'started', ...e }));
      service.on('operationCompleted', (e) => events.push({ type: 'completed', ...e }));

      await service.unregisterTool(toolId);

      expect(events).toEqual([
        { type: 'started', operation: 'unregisterTool', toolId },
        { type: 'completed', operation: 'unregisterTool', toolId, success: true }
      ]);
    });
  });

  describe('tool updates', () => {
    let toolId: string;

    beforeEach(async () => {
      await service.initialize();
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await service.registerTool(config);
      toolId = tool.id;
    });

    it('should update tool metadata', async () => {
      const patch = { description: 'Updated description' };
      const updated = await service.updateTool(toolId, patch);

      expect(updated.description).toBe('Updated description');
      expect(service.getTool(toolId)?.description).toBe('Updated description');
    });

    it('should validate update patch', async () => {
      const invalidPatches = [
        { id: 'new-id' }, // ID cannot be changed
        { name: '' }, // name cannot be empty
        { usageCount: -1 }, // usage count cannot be negative
      ];

      for (const patch of invalidPatches) {
        await expect(service.updateTool(toolId, patch)).rejects.toThrow();
      }
    });

    it('should throw error for non-existent tool', async () => {
      await expect(service.updateTool('non-existent', {})).rejects.toThrow(/not found/);
    });
  });

  describe('connection status management', () => {
    let toolId: string;

    beforeEach(async () => {
      await service.initialize();
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await service.registerTool(config);
      toolId = tool.id;
    });

    it('should update connection status', async () => {
      await service.updateConnectionStatus(toolId, 'connected');

      const tool = service.getTool(toolId);
      expect(tool?.status).toBe('connected');
    });

    it('should throw error for non-existent tool', async () => {
      await expect(
        service.updateConnectionStatus('non-existent', 'connected')
      ).rejects.toThrow(/not found/);
    });
  });

  describe('usage tracking', () => {
    let toolId: string;

    beforeEach(async () => {
      await service.initialize();
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };
      const tool = await service.registerTool(config);
      toolId = tool.id;
    });

    it('should increment usage count', async () => {
      await service.incrementUsage(toolId);

      const tool = service.getTool(toolId);
      expect(tool?.usageCount).toBe(1);
    });

    it('should throw error for non-existent tool', async () => {
      await expect(service.incrementUsage('non-existent')).rejects.toThrow(/not found/);
    });
  });

  describe('querying', () => {
    beforeEach(async () => {
      await service.initialize();

      // 테스트용 도구들 생성
      const configs: McpConfig[] = [
        { type: 'stdio', name: 'search-tool', version: '1.0.0', command: 'node' },
        { type: 'streamableHttp', name: 'api-tool', version: '1.0.0', url: 'https://api.example.com' },
        { type: 'stdio', name: 'dev-tool', version: '1.0.0', command: 'python' }
      ];

      for (const config of configs) {
        const tool = await service.registerTool(config);
        if (config.name === 'search-tool') {
          await service.updateConnectionStatus(tool.id, 'connected');
        }
      }
    });

    it('should get all tools', () => {
      const result = service.getAllTools();
      expect(result.items).toHaveLength(3);
    });

    it('should search tools', async () => {
      const result = await service.searchTools({ keywords: ['search'] });
      expect(result.items).toHaveLength(3); // Mock repo returns all tools
    });

    it('should filter tools by status', () => {
      const connectedTools = service.getToolsByStatus('connected');
      const disconnectedTools = service.getToolsByStatus('disconnected');

      expect(connectedTools).toHaveLength(1);
      expect(disconnectedTools).toHaveLength(2);
    });

    it('should filter tools by category', () => {
      const generalTools = service.getToolsByCategory('general');
      expect(generalTools).toHaveLength(3);
    });

    it('should provide statistics', () => {
      const stats = service.getStatistics();

      expect(stats).toEqual({
        total: 3,
        connected: 1,
        disconnected: 2,
        connecting: 0,
        error: 0,
        byCategory: { general: 3 }
      });
    });

    it('should provide counts', () => {
      expect(service.totalToolsCount).toBe(3);
      expect(service.connectedToolsCount).toBe(1);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle repository errors during registration', async () => {
      // Mock repository에서 에러 발생하도록 설정
      jest.spyOn(mockRepository, 'create').mockRejectedValue(new Error('Repository error'));

      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      await expect(service.registerTool(config)).rejects.toThrow(/Failed to register MCP tool/);
    });

    it('should emit failed operation events on errors', async () => {
      const events: any[] = [];
      service.on('operationCompleted', (e) => events.push(e));

      jest.spyOn(mockRepository, 'create').mockRejectedValue(new Error('Repository error'));

      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      try {
        await service.registerTool(config);
      } catch {
        // Expected error
      }

      expect(events).toContainEqual({
        operation: 'registerTool',
        success: false
      });
    });
  });
});