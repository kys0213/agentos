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
  // MCP handlers
  ipcMain.handle('mcp:get-all', async (_event: IpcMainInvokeEvent) => {
    try {
      const clients = await registry.getAll();
      return clients;
    } catch (error) {
      console.error('Failed to get MCP clients:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp:connect-client', async (_event: IpcMainInvokeEvent, config: any) => {
    try {
      await registry.register(config);
      return { success: true };
    } catch (error) {
      console.error('Failed to connect MCP client:', error);
      throw error;
    }
  });
}
