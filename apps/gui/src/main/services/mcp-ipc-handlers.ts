import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { McpRegistry } from '@agentos/core';

let mcpRegistry: McpRegistry | null = null;

function initializeMcpRegistry(): McpRegistry {
  if (mcpRegistry) return mcpRegistry;

  mcpRegistry = new McpRegistry();

  console.log('MCP registry initialized');
  return mcpRegistry;
}

export function setupMcpIpcHandlers() {
  const registry = initializeMcpRegistry();

  // IpcChannel 인터페이스에 맞춘 MCP 핸들러들

  // getAllMcp
  ipcMain.handle('mcp:get-all', async (_event: IpcMainInvokeEvent) => {
    try {
      const clients = await registry.getAll();
      return clients;
    } catch (error) {
      console.error('Failed to get MCP clients:', error);
      throw error;
    }
  });

  // connectMcp
  ipcMain.handle('mcp:connect', async (_event: IpcMainInvokeEvent, config: any) => {
    try {
      await registry.register(config);
      return { success: true };
    } catch (error) {
      console.error('Failed to connect MCP client:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // disconnectMcp
  ipcMain.handle('mcp:disconnect', async (_event: IpcMainInvokeEvent, name: string) => {
    try {
      // TODO: 실제 MCP 클라이언트 연결 해제 구현 필요
      console.log(`Disconnecting MCP client: ${name}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect MCP client:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // executeMcpTool
  ipcMain.handle(
    'mcp:execute-tool',
    async (_event: IpcMainInvokeEvent, clientName: string, toolName: string, args: any) => {
      try {
        // TODO: 실제 MCP 도구 실행 구현 필요
        console.log(`Executing tool ${toolName} on client ${clientName} with args:`, args);
        return {
          success: true,
          result: `Tool ${toolName} executed successfully`,
          error: undefined,
        };
      } catch (error) {
        console.error('Failed to execute MCP tool:', error);
        return {
          success: false,
          result: undefined,
          error: (error as Error).message,
        };
      }
    }
  );

  // getMcpResources
  ipcMain.handle('mcp:get-resources', async (_event: IpcMainInvokeEvent, clientName: string) => {
    try {
      // TODO: 실제 MCP 리소스 조회 구현 필요
      console.log(`Getting resources for MCP client: ${clientName}`);
      return {
        resources: [],
      };
    } catch (error) {
      console.error('Failed to get MCP resources:', error);
      throw error;
    }
  });

  // readMcpResource
  ipcMain.handle(
    'mcp:read-resource',
    async (_event: IpcMainInvokeEvent, clientName: string, uri: string) => {
      try {
        // TODO: 실제 MCP 리소스 읽기 구현 필요
        console.log(`Reading resource ${uri} from MCP client: ${clientName}`);
        return {
          uri,
          mimeType: 'text/plain',
          content: `Content of resource ${uri}`,
        };
      } catch (error) {
        console.error('Failed to read MCP resource:', error);
        throw error;
      }
    }
  );

  // getMcpStatus
  ipcMain.handle('mcp:get-status', async (_event: IpcMainInvokeEvent, clientName: string) => {
    try {
      // TODO: 실제 MCP 클라이언트 상태 조회 구현 필요
      console.log(`Getting status for MCP client: ${clientName}`);
      return {
        connected: true,
        error: undefined,
      };
    } catch (error) {
      console.error('Failed to get MCP status:', error);
      return {
        connected: false,
        error: (error as Error).message,
      };
    }
  });
}
