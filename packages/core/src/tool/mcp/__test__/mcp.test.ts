import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { mock, MockProxy } from 'jest-mock-extended';
import { Mcp } from '../mcp';
import { McpConfig } from '../mcp-config';
import { McpEvent } from '../mcp-event';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/client/index');

describe('Mcp', () => {
  let mockClient: MockProxy<Client>;
  let mockTransport: MockProxy<Transport>;
  let config: McpConfig;
  let mcp: Mcp;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock client
    mockClient = mock<Client>();

    // Setup mock transport
    mockTransport = mock<Transport>();

    // Setup config
    config = {
      type: 'sse',
      url: 'http://test-url',
      name: 'test-mcp',
      version: '1.0.0',
      network: {
        timeoutMs: 5000,
        maxTotalTimeoutMs: 10000,
        maxConnectionIdleTimeoutMs: 30000,
      },
    };

    // Create Mcp instance
    mcp = new Mcp(mockClient, mockTransport, config);
  });

  afterEach(async () => {
    if (mcp.isConnected()) {
      await mcp.disconnect();
    }
  });

  describe('connection management', () => {
    it('should connect successfully', async () => {
      const connectPromise = mcp.connect();
      expect(mockClient.connect).toHaveBeenCalled();
      await connectPromise;
      expect(mcp.isConnected()).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await mcp.connect();
      await mcp.disconnect();
      expect(mockClient.close).toHaveBeenCalled();
      expect(mcp.isConnected()).toBe(false);
    });

    it('should not connect if already connected', async () => {
      await mcp.connect();
      await mcp.connect();
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('tool invocation', () => {
    const mockTool: Tool = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
        },
      },
    };

    beforeEach(async () => {
      await mcp.connect();
    });

    it('should invoke tool successfully', async () => {
      const mockResult = { contents: [], isError: false };
      mockClient.callTool.mockResolvedValue(mockResult);

      const result = await mcp.invokeTool(mockTool, {
        input: { param1: 'value1' },
      });

      expect(mockClient.callTool).toHaveBeenCalledWith(
        {
          name: 'test-tool',
          arguments: { param1: 'value1' },
        },
        undefined,
        expect.any(Object)
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('resource management', () => {
    beforeEach(async () => {
      await mcp.connect();
    });

    it('should get resource successfully', async () => {
      const mockResource = {
        contents: [
          {
            uri: 'test-uri',
            text: 'test content',
            mimeType: 'text/plain',
          },
        ],
      };
      mockClient.readResource.mockResolvedValue(mockResource);

      const result = await mcp.getResource('test-uri');
      expect(result).toEqual(mockResource.contents);
    });

    it('should get resources list successfully', async () => {
      const mockResources = {
        resources: [
          { name: 'resource1', uri: 'uri1', mimeType: 'text/plain' },
          { name: 'resource2', uri: 'uri2', mimeType: 'text/plain' },
        ],
      };
      mockClient.listResources.mockResolvedValue(mockResources);

      const result = await mcp.getResources();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test-mcp.resource1');
    });
  });

  describe('prompt management', () => {
    beforeEach(async () => {
      await mcp.connect();
    });

    it('should get prompt successfully', async () => {
      const mockPrompt = {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: 'test message',
            },
          },
        ],
      };
      mockClient.getPrompt.mockResolvedValue(mockPrompt);

      const result = await mcp.getPrompt('test-prompt');
      expect(result).toEqual(mockPrompt.messages);
    });

    it('should get prompts list successfully', async () => {
      const mockPrompts = {
        prompts: [
          { name: 'prompt1', description: 'Test prompt 1' },
          { name: 'prompt2', description: 'Test prompt 2' },
        ],
      };
      mockClient.listPrompts.mockResolvedValue(mockPrompts);

      const result = await mcp.getPrompts();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test-mcp.prompt1');
    });
  });

  describe('event handling', () => {
    it('should emit connected event on successful connection', async () => {
      const connectedHandler = jest.fn();
      mcp.on(McpEvent.CONNECTED, connectedHandler);

      await mcp.connect();
      expect(connectedHandler).toHaveBeenCalled();
    });

    it('should emit disconnected event on successful disconnection', async () => {
      const disconnectedHandler = jest.fn();
      mcp.on(McpEvent.DISCONNECTED, disconnectedHandler);

      await mcp.connect();
      await mcp.disconnect();
      expect(disconnectedHandler).toHaveBeenCalled();
    });
  });

  describe('usage tracking disabled by default', () => {
    it('should not track usage when tracking is disabled', async () => {
      const mockTool: Tool = {
        name: 'test-tool',
        description: 'Test tool',
        inputSchema: { type: 'object', properties: {} },
      };

      await mcp.connect();
      mockClient.callTool.mockResolvedValue({ contents: [], isError: false });

      await mcp.invokeTool(mockTool);

      expect(mcp.isUsageTrackingEnabled()).toBe(false);
      expect(mcp.getUsageLogs()).toHaveLength(0);
      expect(mcp.getUsageStats().totalUsage).toBe(0);
    });

    it('should return empty metadata when tracking is disabled', () => {
      const metadata = mcp.getMetadata();
      
      expect(metadata.id).toBeDefined();
      expect(metadata.name).toBe('test-mcp');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.usageCount).toBe(0);
      expect(metadata.status).toBe('disconnected');
    });
  });

  describe('static factory method', () => {
    it('should create instance without usage tracking by default', () => {
      const mcpInstance = Mcp.create(config);
      expect(mcpInstance.isUsageTrackingEnabled()).toBe(false);
    });

    it('should create instance with usage tracking when enabled', () => {
      const mcpInstance = Mcp.create(config, true);
      expect(mcpInstance.isUsageTrackingEnabled()).toBe(true);
    });
  });
});

describe('Mcp with usage tracking enabled', () => {
  let mockClient: MockProxy<Client>;
  let mockTransport: MockProxy<Transport>;
  let config: McpConfig;
  let mcp: Mcp;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = mock<Client>();
    mockTransport = mock<Transport>();

    config = {
      type: 'sse',
      url: 'http://test-url',
      name: 'test-mcp',
      version: '1.0.0',
      network: {
        timeoutMs: 5000,
        maxTotalTimeoutMs: 10000,
        maxConnectionIdleTimeoutMs: 30000,
      },
    };

    // Create Mcp instance with usage tracking enabled
    mcp = new Mcp(mockClient, mockTransport, config, true);
  });

  afterEach(async () => {
    if (mcp.isConnected()) {
      await mcp.disconnect();
    }
  });

  describe('usage tracking', () => {
    const mockTool: Tool = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: { type: 'object', properties: {} },
    };

    beforeEach(async () => {
      await mcp.connect();
    });

    it('should track successful tool usage', async () => {
      mockClient.callTool.mockResolvedValue({ contents: [], isError: false });

      await mcp.invokeTool(mockTool, {
        input: { param: 'value' },
        agentId: 'agent1',
        agentName: 'Test Agent',
      });

      const logs = mcp.getUsageLogs();
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log.toolName).toBe('test-tool');
      expect(log.action).toBe('invoke');
      expect(log.status).toBe('success');
      expect(log.agentId).toBe('agent1');
      expect(log.agentName).toBe('Test Agent');
      expect(log.parameters).toEqual({ param: 'value' });
      expect(log.duration).toBeGreaterThanOrEqual(0);
    });

    it('should track failed tool usage', async () => {
      mockClient.callTool.mockResolvedValue({ 
        content: 'Test error',
        isError: true 
      });

      try {
        await mcp.invokeTool(mockTool);
      } catch (error) {
        // Expected to throw
      }

      const logs = mcp.getUsageLogs();
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log.status).toBe('error');
      expect(log.error).toBe('Tool call failed reason: Test error');
    });

    it('should update metadata after tool usage', async () => {
      mockClient.callTool.mockResolvedValue({ contents: [], isError: false });

      const initialMetadata = mcp.getMetadata();
      expect(initialMetadata.usageCount).toBe(0);
      expect(initialMetadata.lastUsedAt).toBeUndefined();

      await mcp.invokeTool(mockTool);

      const updatedMetadata = mcp.getMetadata();
      expect(updatedMetadata.usageCount).toBe(1);
      expect(updatedMetadata.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should generate correct usage statistics', async () => {
      mockClient.callTool
        .mockResolvedValueOnce({ contents: [], isError: false })
        .mockResolvedValueOnce({ contents: [], isError: false })
        .mockResolvedValueOnce({ content: 'Error', isError: true });

      // Two successful calls
      await mcp.invokeTool(mockTool);
      await mcp.invokeTool(mockTool);

      // One failed call
      try {
        await mcp.invokeTool(mockTool);
      } catch (error) {
        // Expected to throw
      }

      const stats = mcp.getUsageStats();
      expect(stats.totalUsage).toBe(3);
      expect(stats.successRate).toBe(2/3);
      expect(stats.errorCount).toBe(1);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
      expect(stats.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should clear usage logs', async () => {
      mockClient.callTool.mockResolvedValue({ contents: [], isError: false });
      
      await mcp.invokeTool(mockTool);
      expect(mcp.getUsageLogs()).toHaveLength(1);
      
      mcp.clearUsageLogs();
      expect(mcp.getUsageLogs()).toHaveLength(0);
    });

    it('should get all usage logs across tools', async () => {
      mockClient.callTool.mockResolvedValue({ contents: [], isError: false });
      
      await mcp.invokeTool(mockTool);
      await mcp.invokeTool({ ...mockTool, name: 'another-tool' });
      
      const allLogs = mcp.getAllUsageLogs();
      expect(allLogs).toHaveLength(2);
    });
  });

  describe('connection status tracking', () => {
    it('should update metadata status on connection', async () => {
      const initialMetadata = mcp.getMetadata();
      expect(initialMetadata.status).toBe('disconnected');

      await mcp.connect();

      const connectedMetadata = mcp.getMetadata();
      expect(connectedMetadata.status).toBe('connected');
    });

    it('should update metadata status on disconnection', async () => {
      await mcp.connect();
      await mcp.disconnect();

      const disconnectedMetadata = mcp.getMetadata();
      expect(disconnectedMetadata.status).toBe('disconnected');
    });

    it('should update metadata status on connection error', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      try {
        await mcp.connect();
      } catch (error) {
        // Expected to throw
      }

      const errorMetadata = mcp.getMetadata();
      expect(errorMetadata.status).toBe('error');
    });
  });
});
