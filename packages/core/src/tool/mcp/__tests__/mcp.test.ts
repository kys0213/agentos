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
    it('should successfully invoke tool without usage tracking', async () => {
      const mockTool: Tool = {
        name: 'test-tool',
        description: 'Test tool',
        inputSchema: { type: 'object', properties: {} },
      };

      await mcp.connect();
      mockClient.callTool.mockResolvedValue({ contents: [], isError: false });

      const result = await mcp.invokeTool(mockTool);

      expect(result.isError).toBe(false);
      expect(result.contents).toEqual([]);
      expect(mockClient.callTool).toHaveBeenCalledWith(
        { name: 'test-tool', arguments: undefined },
        undefined,
        expect.objectContaining({
          timeout: 5000,
          maxTotalTimeout: 10000
        })
      );
    });

    it('should provide basic mcp properties', () => {
      expect(mcp.name).toBe('test-mcp');
      expect(mcp.version).toBe('1.0.0');
      expect(mcp.isConnected()).toBe(false);
    });
  });

  describe('static factory method', () => {
    it('should create instance with correct configuration', () => {
      const mcpInstance = Mcp.create(config);
      expect(mcpInstance.name).toBe('test-mcp');
      expect(mcpInstance.version).toBe('1.0.0');
      expect(mcpInstance.isConnected()).toBe(false);
    });
  });
});
