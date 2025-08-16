import { McpConfig } from '../../mcp-config';
import { McpToolMetadata } from '../../mcp-types';
import { McpMetadataRegistry } from '../../registry/mcp-metadata-registry';
import { McpToolRepository } from '../../repository/mcp-tool-repository';
import { McpService } from '../mcp-service';

// Mock 함수들
const createMockRepository = (): jest.Mocked<McpToolRepository> => {
  const mockRepo: jest.Mocked<McpToolRepository> = {
    get: jest.fn(),
    list: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    on: jest.fn(),
  };

  // 기본 동작 설정
  mockRepo.list.mockResolvedValue({
    items: [],
    nextCursor: '',
    hasMore: false,
  });

  return mockRepo;
};

const createMockMcpRegistry = () => {
  return {
    register: jest.fn(),
    unregister: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue([]),
    getTool: jest.fn().mockResolvedValue(null),
    getToolOrThrow: jest.fn(),
    getOrThrow: jest.fn(),
    onRegister: jest.fn(),
    onUnregister: jest.fn(),
    isRegistered: jest.fn().mockReturnValue(false),
    unregisterAll: jest.fn(),
    parseMcpAndToolName: jest.fn().mockReturnValue({ mcpName: 'test', toolName: null }),
  };
};

describe('McpService', () => {
  let service: McpService;
  let mockRepository: jest.Mocked<McpToolRepository>;
  let mockMcpRegistry: any;
  let registry: McpMetadataRegistry;

  beforeEach(async () => {
    mockRepository = createMockRepository();
    mockMcpRegistry = createMockMcpRegistry();
    
    // 사용자 제안 패턴: 의존성 주입 사용
    registry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
    service = new McpService(mockRepository, registry);
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
        { type: 'completed', operation: 'initialize', success: true },
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
        command: 'node',
      };

      const mockTool: McpToolMetadata = {
        id: 'test-id',
        name: config.name,
        description: `MCP Tool: ${config.name}`,
        version: config.version,
        category: 'general',
        provider: 'Test Provider',
        status: 'connected',
        usageCount: 0,
        permissions: [],
        config,
      };

      // Repository mock 설정
      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(mockTool);
      
      // McpRegistry mock 설정 - 성공적인 등록
      mockMcpRegistry.register.mockResolvedValue(undefined);

      const tool = await service.registerTool(config);

      expect(tool.name).toBe('test-tool');
      expect(tool.status).toBe('connected');
      expect(mockMcpRegistry.register).toHaveBeenCalledWith(config);
      expect(mockRepository.create).toHaveBeenCalledWith(config);
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
        command: 'node',
      };

      const mockTool: McpToolMetadata = {
        id: 'test-id',
        name: config.name,
        description: `MCP Tool: ${config.name}`,
        version: config.version,
        category: 'general',
        provider: 'Test Provider',
        status: 'connected',
        usageCount: 0,
        permissions: [],
        config,
      };

      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(mockTool);
      mockMcpRegistry.register.mockResolvedValue(undefined);

      const tool = await service.registerTool(config);

      expect(events).toEqual([
        { type: 'started', operation: 'registerTool' },
        { type: 'completed', operation: 'registerTool', toolId: tool.id, success: true },
      ]);
    });

    it('should forward registry events', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      const mockTool: McpToolMetadata = {
        id: 'test-id',
        name: config.name,
        description: `MCP Tool: ${config.name}`,
        version: config.version,
        category: 'general',
        provider: 'Test Provider',
        status: 'connected',
        usageCount: 0,
        permissions: [],
        config,
      };

      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(mockTool);
      mockMcpRegistry.register.mockResolvedValue(undefined);

      const toolAddedEvent = new Promise((resolve) => {
        service.on('toolAdded', resolve);
      });

      const tool = await service.registerTool(config);
      const event = await toolAddedEvent;

      expect(event).toEqual({ tool });
    });

    it('should handle registration failure', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      const mockTool: McpToolMetadata = {
        id: 'test-id',
        name: config.name,
        description: `MCP Tool: ${config.name}`,
        version: config.version,
        category: 'general',
        provider: 'Test Provider',
        status: 'disconnected',
        usageCount: 0,
        permissions: [],
        config,
      };

      const errorTool: McpToolMetadata = {
        ...mockTool,
        status: 'error',
      };

      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(errorTool);
      mockMcpRegistry.register.mockRejectedValue(new Error('Connection failed'));

      await expect(service.registerTool(config)).rejects.toThrow(/Failed to register MCP tool/);
      
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockTool.id,
        { status: 'error' }
      );
    });
  });

  describe('tool unregistration', () => {
    let toolId: string;
    let mockTool: McpToolMetadata;

    beforeEach(async () => {
      await service.initialize();
      
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      mockTool = {
        id: 'test-id',
        name: config.name,
        description: `MCP Tool: ${config.name}`,
        version: config.version,
        category: 'general',
        provider: 'Test Provider',
        status: 'connected',
        usageCount: 0,
        permissions: [],
        config,
      };

      toolId = mockTool.id;

      // Registry cache 설정
      (registry as any).metadataCache.set(toolId, mockTool);
    });

    it('should unregister existing tool', async () => {
      mockMcpRegistry.isRegistered.mockReturnValue(true);
      mockMcpRegistry.unregister.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.unregisterTool(toolId);
      
      expect(mockMcpRegistry.unregister).toHaveBeenCalledWith(mockTool.name);
      expect(mockRepository.delete).toHaveBeenCalledWith(toolId);
    });

    it('should throw error for non-existent tool', async () => {
      await expect(service.unregisterTool('non-existent')).rejects.toThrow(/not found/);
    });

    it('should emit operation events during unregistration', async () => {
      const events: any[] = [];
      service.on('operationStarted', (e) => events.push({ type: 'started', ...e }));
      service.on('operationCompleted', (e) => events.push({ type: 'completed', ...e }));

      mockMcpRegistry.isRegistered.mockReturnValue(true);
      mockMcpRegistry.unregister.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.unregisterTool(toolId);

      expect(events).toEqual([
        { type: 'started', operation: 'unregisterTool', toolId },
        { type: 'completed', operation: 'unregisterTool', toolId, success: true },
      ]);
    });
  });

  describe('tool updates', () => {
    let toolId: string;
    let mockTool: McpToolMetadata;

    beforeEach(async () => {
      await service.initialize();
      
      mockTool = {
        id: 'test-id',
        name: 'test-tool',
        description: 'Test tool',
        version: '1.0.0',
        category: 'general',
        provider: 'Test Provider',
        status: 'connected',
        usageCount: 0,
        permissions: [],
        config: {
          type: 'stdio',
          name: 'test-tool',
          version: '1.0.0',
          command: 'node',
        },
      };

      toolId = mockTool.id;
      (registry as any).metadataCache.set(toolId, mockTool);
    });

    it('should update tool metadata', async () => {
      const patch = { description: 'Updated description' };
      const updatedTool = { ...mockTool, ...patch };

      mockRepository.update.mockResolvedValue(updatedTool);

      const result = await service.updateTool(toolId, patch);

      expect(result.description).toBe('Updated description');
      expect(mockRepository.update).toHaveBeenCalledWith(toolId, patch, undefined);
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
    let mockTool: McpToolMetadata;

    beforeEach(async () => {
      await service.initialize();
      
      mockTool = {
        id: 'test-id',
        name: 'test-tool',
        description: 'Test tool',
        version: '1.0.0',
        category: 'general',
        provider: 'Test Provider',
        status: 'disconnected',
        usageCount: 0,
        permissions: [],
        config: {
          type: 'stdio',
          name: 'test-tool',
          version: '1.0.0',
          command: 'node',
        },
      };

      toolId = mockTool.id;
      (registry as any).metadataCache.set(toolId, mockTool);
    });

    it('should update connection status', async () => {
      const connectedTool = { ...mockTool, status: 'connected' as const };
      mockRepository.update.mockResolvedValue(connectedTool);

      await service.updateConnectionStatus(toolId, 'connected');

      expect(mockRepository.update).toHaveBeenCalledWith(
        toolId,
        { status: 'connected' }
      );
    });

    it('should throw error for non-existent tool', async () => {
      await expect(service.updateConnectionStatus('non-existent', 'connected')).rejects.toThrow(
        /not found/
      );
    });
  });

  describe('usage tracking', () => {
    let toolId: string;
    let mockTool: McpToolMetadata;

    beforeEach(async () => {
      await service.initialize();
      
      mockTool = {
        id: 'test-id',
        name: 'test-tool',
        description: 'Test tool',
        version: '1.0.0',
        category: 'general',
        provider: 'Test Provider',
        status: 'connected',
        usageCount: 0,
        permissions: [],
        config: {
          type: 'stdio',
          name: 'test-tool',
          version: '1.0.0',
          command: 'node',
        },
      };

      toolId = mockTool.id;
      (registry as any).metadataCache.set(toolId, mockTool);
    });

    it('should increment usage count', async () => {
      const updatedTool = { ...mockTool, usageCount: 1 };
      mockRepository.update.mockResolvedValue(updatedTool);

      await service.incrementUsage(toolId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        toolId,
        expect.objectContaining({
          usageCount: 1,
          lastUsedAt: expect.any(Date)
        }),
        undefined
      );
    });

    it('should throw error for non-existent tool', async () => {
      await expect(service.incrementUsage('non-existent')).rejects.toThrow(/not found/);
    });
  });

  describe('querying', () => {
    beforeEach(async () => {
      await service.initialize();

      // 테스트용 도구들을 cache에 설정
      const tools: McpToolMetadata[] = [
        {
          id: 'tool-1',
          name: 'search-tool',
          description: 'Search tool',
          version: '1.0.0',
          category: 'general',
          provider: 'Test Provider',
          status: 'connected',
          usageCount: 0,
          permissions: [],
          config: { type: 'stdio', name: 'search-tool', version: '1.0.0', command: 'node' },
        },
        {
          id: 'tool-2',
          name: 'api-tool',
          description: 'API tool',
          version: '1.0.0',
          category: 'general',
          provider: 'Test Provider',
          status: 'disconnected',
          usageCount: 0,
          permissions: [],
          config: {
            type: 'streamableHttp',
            name: 'api-tool',
            version: '1.0.0',
            url: 'https://api.example.com',
          },
        },
        {
          id: 'tool-3',
          name: 'dev-tool',
          description: 'Development tool',
          version: '1.0.0',
          category: 'general',
          provider: 'Test Provider',
          status: 'disconnected',
          usageCount: 0,
          permissions: [],
          config: { type: 'stdio', name: 'dev-tool', version: '1.0.0', command: 'python' },
        },
      ];

      const cache = (registry as any).metadataCache;
      tools.forEach(tool => cache.set(tool.id, tool));
    });

    it('should get all tools', () => {
      const result = service.getAllTools();
      expect(result.items).toHaveLength(3);
    });

    it('should search tools', async () => {
      const searchResult = {
        items: [(registry as any).metadataCache.get('tool-1')],
        nextCursor: '',
        hasMore: false,
      };
      
      mockRepository.search.mockResolvedValue(searchResult);

      const result = await service.searchTools({ keywords: ['search'] });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('search-tool');
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
        pending: 0,
        error: 0,
        byCategory: { general: 3 },
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
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      mockRepository.create.mockRejectedValue(new Error('Repository error'));

      await expect(service.registerTool(config)).rejects.toThrow(/Failed to register MCP tool/);
    });

    it('should emit failed operation events on errors', async () => {
      const events: any[] = [];
      service.on('operationCompleted', (e) => events.push(e));

      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      mockRepository.create.mockRejectedValue(new Error('Repository error'));

      try {
        await service.registerTool(config);
      } catch {
        // Expected error
      }

      expect(events).toContainEqual({
        operation: 'registerTool',
        success: false,
      });
    });
  });
});