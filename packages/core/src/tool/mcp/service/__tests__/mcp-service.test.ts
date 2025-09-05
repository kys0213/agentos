import { McpConfig } from '../../mcp-config';
import { McpToolMetadata } from '../../mcp-types';
import { McpMetadataRegistry } from '../../registry/mcp-metadata-registry';
import { McpRegistry } from '../../mcp.registery';
import { McpToolRepository } from '../../repository/mcp-tool-repository';
import { vi } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { McpService } from '../mcp-service';
import type { McpServiceEvents } from '../mcp-service';
import type { Result } from '@agentos/lang/utils';

// Mock 함수들
const createMockRepository = (): MockProxy<McpToolRepository> => {
  const repo = mock<McpToolRepository>();
  repo.list.mockResolvedValue({ items: [], nextCursor: '', hasMore: false });
  return repo;
};

class FakeMcpRegistry extends McpRegistry {
  register = vi.fn(async (_config: McpConfig) => {});
  unregister = vi.fn(async (_name: string): Promise<Result<void> | undefined> => undefined);
  get = vi.fn(async (_name: string) => null);
  getAll = vi.fn(async () => []);
  getTool = vi.fn(async (_name: string) => null);
  getToolOrThrow = vi.fn();
  getOrThrow = vi.fn();
  onRegister = vi.fn((_fn: (m: unknown) => void) => {});
  onUnregister = vi.fn((_fn: (m: unknown) => void) => {});
  isRegistered = vi.fn((_name: string) => false);
  unregisterAll = vi.fn(async () => {});
}

describe('McpService', () => {
  let service: McpService;
  let mockRepository: MockProxy<McpToolRepository>;
  let mockMcpRegistry: FakeMcpRegistry;
  let registry: McpMetadataRegistry;

  beforeEach(async () => {
    mockRepository = createMockRepository();
    mockMcpRegistry = new FakeMcpRegistry();

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
      const started: McpServiceEvents['operationStarted'][] = [];
      const completed: McpServiceEvents['operationCompleted'][] = [];
      service.on('operationStarted', (e) => started.push(e));
      service.on('operationCompleted', (e) => completed.push(e));

      await service.initialize();

      expect(started).toEqual([{ operation: 'initialize' }]);
      expect(completed).toEqual([{ operation: 'initialize', success: true }]);
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
      const started: McpServiceEvents['operationStarted'][] = [];
      const completed: McpServiceEvents['operationCompleted'][] = [];
      service.on('operationStarted', (e) => started.push(e));
      service.on('operationCompleted', (e) => completed.push(e));

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

      expect(started).toEqual([{ operation: 'registerTool' }]);
      expect(completed).toEqual([{ operation: 'registerTool', toolId: tool.id, success: true }]);
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

      expect(mockRepository.update).toHaveBeenCalledWith(mockTool.id, { status: 'error' });
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

      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(mockTool);
      mockMcpRegistry.register.mockResolvedValue(undefined);
      const tool = await service.registerTool(config);
      toolId = tool.id;
      mockTool = tool;
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
      const started: McpServiceEvents['operationStarted'][] = [];
      const completed: McpServiceEvents['operationCompleted'][] = [];
      service.on('operationStarted', (e) => started.push(e));
      service.on('operationCompleted', (e) => completed.push(e));

      mockMcpRegistry.isRegistered.mockReturnValue(true);
      mockMcpRegistry.unregister.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.unregisterTool(toolId);

      expect(started).toEqual([{ operation: 'unregisterTool', toolId }]);
      expect(completed).toEqual([{ operation: 'unregisterTool', toolId, success: true }]);
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

      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(mockTool);
      mockMcpRegistry.register.mockResolvedValue(undefined);
      const tool = await service.registerTool(mockTool.config as McpConfig);
      toolId = tool.id;
      mockTool = tool;
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

      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(mockTool);
      mockMcpRegistry.register.mockResolvedValue(undefined);
      const tool = await service.registerTool(mockTool.config as McpConfig);
      toolId = tool.id;
      mockTool = tool;
    });

    it('should update connection status', async () => {
      const connectedTool = { ...mockTool, status: 'connected' as const };
      mockRepository.update.mockResolvedValue(connectedTool);

      await service.updateConnectionStatus(toolId, 'connected');

      expect(mockRepository.update).toHaveBeenCalledWith(toolId, { status: 'connected' });
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

      mockRepository.create.mockResolvedValue(mockTool);
      mockRepository.update.mockResolvedValue(mockTool);
      mockMcpRegistry.register.mockResolvedValue(undefined);
      const tool = await service.registerTool(mockTool.config as McpConfig);
      toolId = tool.id;
      mockTool = tool;
    });

    it('should increment usage count', async () => {
      const updatedTool = { ...mockTool, usageCount: 1 };
      mockRepository.update.mockResolvedValue(updatedTool);

      await service.incrementUsage(toolId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        toolId,
        expect.objectContaining({
          usageCount: 1,
          lastUsedAt: expect.any(Date),
        }),
        undefined
      );
    });

    it('should throw error for non-existent tool', async () => {
      await expect(service.incrementUsage('non-existent')).rejects.toThrow(/not found/);
    });
  });

  describe('querying', () => {
    let tools: McpToolMetadata[];
    beforeEach(async () => {
      await service.initialize();

      // 테스트용 도구들을 cache에 설정
      tools = [
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

      mockRepository.list.mockResolvedValue({ items: tools, nextCursor: '', hasMore: false });
      // 새 Registry/Service로 초기화하여 메타데이터 재로딩
      registry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
      service = new McpService(mockRepository, registry);
      await service.initialize();
    });

    it('should get all tools', () => {
      const result = service.getAllTools();
      expect(result.items).toHaveLength(3);
    });

    it('should search tools', async () => {
      const searchResult = {
        items: [tools[0]],
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
      const completed: McpServiceEvents['operationCompleted'][] = [];
      service.on('operationCompleted', (e) => completed.push(e));

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

      expect(completed).toContainEqual({
        operation: 'registerTool',
        success: false,
      });
    });
  });
});
