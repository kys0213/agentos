import { McpMetadataRegistry } from '../mcp-metadata-registry';
import {
  McpToolRepository,
  McpToolRepositoryEventPayload,
} from '../../repository/mcp-tool-repository';
import { McpToolMetadata, McpConnectionStatus } from '../../mcp-types';
import { McpConfig } from '../../mcp-config';
import {
  CursorPagination,
  CursorPaginationResult,
} from '../../../../common/pagination/cursor-pagination';

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
      hasMore: false,
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
      config: {},
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
      version: `v${Date.now()}`, // 새 버전 할당
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

  on(
    event: 'changed' | 'deleted' | 'statusChanged',
    handler: (payload: McpToolRepositoryEventPayload) => void
  ): () => void {
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
    handlers.forEach((handler) => handler(payload));
  }
}

// MCP 연결 실패를 시뮬레이션하기 위한 Mock
jest.mock('../mcp-metadata-registry', () => {
  const actual = jest.requireActual('../mcp-metadata-registry');
  return {
    ...actual,
    McpMetadataRegistry: class extends actual.McpMetadataRegistry {
      // MCP Registry mock을 위해 생성자에서 실제 연결을 하지 않도록 override
      constructor(repository: any) {
        super(repository);
        // 실제 MCP 연결을 모킹하기 위해 mcpRegistry를 mock으로 교체할 수 있음
      }
    },
  };
});

describe('McpMetadataRegistry', () => {
  let registry: McpMetadataRegistry;
  let mockRepository: MockMcpToolRepository;

  beforeEach(async () => {
    mockRepository = new MockMcpToolRepository();
    registry = new McpMetadataRegistry(mockRepository);
    await registry.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newRegistry = new McpMetadataRegistry(mockRepository);
      await expect(newRegistry.initialize()).resolves.toBeUndefined();
    });

    it('should load existing tools from repository on initialization', async () => {
      // Repository에 도구 미리 생성
      const config: McpConfig = {
        type: 'stdio',
        name: 'existing-tool',
        version: '1.0.0',
        command: 'node',
      };
      await mockRepository.create(config);

      // 새 레지스트리 인스턴스로 초기화
      const newRegistry = new McpMetadataRegistry(mockRepository);
      await newRegistry.initialize();

      expect(newRegistry.totalToolsCount).toBe(1);
    });
  });

  describe('tool registration', () => {
    it('should register a new tool with metadata persistence', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      // MCP 연결 실패를 시뮬레이션 (실제 MCP 서버가 없으므로)
      await expect(registry.registerTool(config)).rejects.toThrow();

      // 그래도 메타데이터는 저장되어야 함
      expect(registry.totalToolsCount).toBe(1);

      const tools = registry.getAllTools().items;
      expect(tools[0].name).toBe('test-tool');
      expect(tools[0].status).toBe('error'); // 연결 실패로 error 상태
    });

    it('should emit toolAdded event on registration', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      const eventPromise = new Promise((resolve) => {
        registry.on('toolAdded', resolve);
      });

      try {
        await registry.registerTool(config);
      } catch {
        // MCP 연결 실패는 예상됨
      }

      const event = await eventPromise;
      expect(event).toHaveProperty('tool');
    });
  });

  describe('tool metadata management', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      try {
        await registry.registerTool(config);
      } catch {
        // MCP 연결 실패는 무시
      }

      const tools = registry.getAllTools().items;
      toolId = tools[0].id;
    });

    it('should get tool by ID', () => {
      const tool = registry.getTool(toolId);
      expect(tool).not.toBeNull();
      expect(tool?.name).toBe('test-tool');
    });

    it('should update tool metadata', async () => {
      const patch = { description: 'Updated description' };
      const updated = await registry.updateTool(toolId, patch);

      expect(updated.description).toBe('Updated description');
      expect(registry.getTool(toolId)?.description).toBe('Updated description');
    });

    it('should update connection status', async () => {
      const updated = await registry.updateConnectionStatus(toolId, 'connected');

      expect(updated.status).toBe('connected');
      expect(registry.getTool(toolId)?.status).toBe('connected');
    });

    it('should emit connectionStatusChanged event', async () => {
      const eventPromise = new Promise((resolve) => {
        registry.on('connectionStatusChanged', resolve);
      });

      await registry.updateConnectionStatus(toolId, 'connected');
      const event = await eventPromise;

      expect(event).toMatchObject({
        toolId,
        status: 'connected',
      });
    });

    it('should increment usage count', async () => {
      await registry.incrementUsage(toolId);

      const tool = registry.getTool(toolId);
      expect(tool?.usageCount).toBe(1);
      expect(tool?.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent tool usage increment', async () => {
      await expect(registry.incrementUsage('non-existent')).rejects.toThrow(/not found/);
    });
  });

  describe('tool unregistration', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      try {
        await registry.registerTool(config);
      } catch {
        // MCP 연결 실패는 무시
      }

      const tools = registry.getAllTools().items;
      toolId = tools[0].id;
    });

    it('should unregister existing tool', async () => {
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

    it('should throw error for non-existent tool', async () => {
      await expect(registry.unregisterTool('non-existent')).rejects.toThrow(/not found/);
    });
  });

  describe('querying', () => {
    beforeEach(async () => {
      const configs: McpConfig[] = [
        { type: 'stdio', name: 'tool1', version: '1.0.0', command: 'node' },
        { type: 'stdio', name: 'tool2', version: '1.0.0', command: 'python' },
        { type: 'stdio', name: 'tool3', version: '1.0.0', command: 'java' },
      ];

      for (const config of configs) {
        try {
          await registry.registerTool(config);
        } catch {
          // MCP 연결 실패는 무시
        }
      }
    });

    it('should get all tools', () => {
      const result = registry.getAllTools();
      expect(result.items).toHaveLength(3);
    });

    it('should support pagination', () => {
      const result = registry.getAllTools({ cursor: '', limit: 2, direction: 'forward' });
      expect(result.items).toHaveLength(2);
    });

    it('should filter tools by status', () => {
      const errorTools = registry.getToolsByStatus('error');
      expect(errorTools).toHaveLength(3); // 모든 도구가 연결 실패로 error 상태
    });

    it('should provide counts', () => {
      expect(registry.totalToolsCount).toBe(3);
      expect(registry.connectedToolsCount).toBe(0); // 실제 연결된 도구 없음
    });
  });

  describe('MCP integration', () => {
    it('should return null for non-existent MCP', async () => {
      const mcp = await registry.getMcp('non-existent');
      expect(mcp).toBeNull();
    });

    it('should throw error for non-existent tool execution', async () => {
      await expect(registry.executeTool('non-existent.tool', {})).rejects.toThrow(/not found/);
    });
  });
});
