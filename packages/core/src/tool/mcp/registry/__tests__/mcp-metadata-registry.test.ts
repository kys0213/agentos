import { mock } from 'vitest-mock-extended';
import { McpRegistry } from '../..';
import { McpConfig } from '../../mcp-config';
import { McpMetadataRegistry } from '../mcp-metadata-registry';
import { MockMcpToolRepository } from './fixture';

describe('McpMetadataRegistry', () => {
  let registry: McpMetadataRegistry;
  let mockRepository: MockMcpToolRepository;
  let mockMcpRegistry: ReturnType<typeof mock<McpRegistry>>;

  beforeEach(async () => {
    mockMcpRegistry = mock<McpRegistry>();
    mockRepository = new MockMcpToolRepository();
    registry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
    await registry.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newRegistry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
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
      const newRegistry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
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

      mockMcpRegistry.register.mockRejectedValue(new Error('Connection failed'));

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
      expect(errorTools).toHaveLength(0);
    });

    it('should provide counts', () => {
      expect(registry.totalToolsCount).toBe(3);
      expect(registry.connectedToolsCount).toBe(3);
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
