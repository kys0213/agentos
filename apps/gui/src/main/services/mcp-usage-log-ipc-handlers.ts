import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import { McpRegistry } from '@agentos/core';
import type { McpUsageUpdateEvent } from '../../shared/types/mcp-usage-types';

let mcpRegistry: McpRegistry | null = null;
let mainWindow: BrowserWindow | null = null;
const usageSubscriptions: Map<string, () => void> = new Map();

function initializeMcpRegistry(): McpRegistry {
  if (mcpRegistry) return mcpRegistry;
  mcpRegistry = new McpRegistry();
  return mcpRegistry;
}

function broadcastUsageEvent(event: McpUsageUpdateEvent) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('mcp:usage-update', event);
  }
}

export function setupMcpUsageLogIpcHandlers(window?: BrowserWindow) {
  if (window) mainWindow = window;
  const registry = initializeMcpRegistry();

  ipcMain.handle(
    'mcpUsageLog:get-usage-logs',
    async (_event: IpcMainInvokeEvent, clientName: string, options?: any) => {
      const client = await registry.get(clientName);
      if (!client) throw new Error(`MCP client not found: ${clientName}`);

      let logs = client.getUsageLogs();
      if (options?.status) logs = logs.filter((l) => l.status === options.status);
      if (options?.agentId) logs = logs.filter((l) => l.agentId === options.agentId);
      if (options?.sortOrder === 'asc') logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      else logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0;
        const limit = options.limit || 50;
        logs = logs.slice(offset, offset + limit);
      }
      return logs;
    }
  );

  ipcMain.handle('mcpUsageLog:get-all-usage-logs', async (_e: IpcMainInvokeEvent, options?: any) => {
    const clients = await registry.getAll();
    let allLogs: any[] = [];
    for (const client of clients) {
      try {
        allLogs = allLogs.concat(client.getUsageLogs());
      } catch (err) {
        console.error(`Failed to get logs for ${client.name}:`, err);
      }
    }
    if (options?.status) allLogs = allLogs.filter((l) => l.status === options.status);
    if (options?.agentId) allLogs = allLogs.filter((l) => l.agentId === options.agentId);
    if (options?.sortOrder === 'asc') allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    else allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      allLogs = allLogs.slice(offset, offset + limit);
    }
    return allLogs;
  });

  ipcMain.handle('mcpUsageLog:get-usage-stats', async (_e: IpcMainInvokeEvent, clientName?: string) => {
    if (clientName) {
      const client = await registry.get(clientName);
      if (!client) throw new Error(`MCP client not found: ${clientName}`);
      return client.getUsageStats();
    }
    const clients = await registry.getAll();
    const allStats = await Promise.all(clients.map((c) => c.getUsageStats()));
    const totalUsage = allStats.reduce((sum, s) => sum + s.totalUsage, 0);
    const totalErrors = allStats.reduce((sum, s) => sum + s.errorCount, 0);
    const totalDuration = allStats.reduce((sum, s) => sum + s.averageDuration * s.totalUsage, 0);
    const lastTimes = allStats.map((s) => s.lastUsedAt).filter(Boolean).map((d) => d!.getTime());
    return {
      totalUsage,
      successRate: totalUsage > 0 ? (totalUsage - totalErrors) / totalUsage : 0,
      averageDuration: totalUsage > 0 ? totalDuration / totalUsage : 0,
      lastUsedAt: lastTimes.length > 0 ? new Date(Math.max(...lastTimes)) : undefined,
      errorCount: totalErrors,
    };
  });

  ipcMain.handle(
    'mcpUsageLog:get-hourly-stats',
    async (_e: IpcMainInvokeEvent, date: string, clientName?: string) => {
      const targetDate = new Date(date);
      const hourlyData: Array<[number, number]> = Array.from({ length: 24 }, (_, h) => [h, 0]);

      const addLogs = (logs: any[]) => {
        logs
          .filter((log) => {
            const d = log.timestamp;
            return (
              d.getFullYear() === targetDate.getFullYear() &&
              d.getMonth() === targetDate.getMonth() &&
              d.getDate() === targetDate.getDate()
            );
          })
          .forEach((log) => {
            const hour = log.timestamp.getHours();
            hourlyData[hour][1]++;
          });
      };

      if (clientName) {
        const client = await registry.get(clientName);
        if (!client) throw new Error(`MCP client not found: ${clientName}`);
        addLogs(client.getUsageLogs());
      } else {
        const clients = await registry.getAll();
        for (const c of clients) {
          try {
            addLogs(c.getUsageLogs());
          } catch (err) {
            console.error(`Failed to get hourly stats for ${c.name}:`, err);
          }
        }
      }
      return { hourlyData };
    }
  );

  ipcMain.handle(
    'mcpUsageLog:get-usage-logs-in-range',
    async (_e: IpcMainInvokeEvent, startDate: string, endDate: string, clientName?: string) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let allLogs: any[] = [];
      if (clientName) {
        const client = await registry.get(clientName);
        if (!client) throw new Error(`MCP client not found: ${clientName}`);
        allLogs = client.getUsageLogs();
      } else {
        const clients = await registry.getAll();
        for (const c of clients) {
          try {
            allLogs = allLogs.concat(c.getUsageLogs());
          } catch (err) {
            console.error(`Failed to get logs for ${c.name}:`, err);
          }
        }
      }
      return allLogs
        .filter((log) => {
          const t = log.timestamp.getTime();
          return t >= start.getTime() && t <= end.getTime();
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  );

  ipcMain.handle('mcpUsageLog:clear-usage-logs', async (_e: IpcMainInvokeEvent, olderThan?: string) => {
    const clients = await registry.getAll();
    let totalCleared = 0;
    for (const c of clients) {
      try {
        console.log(`Clearing usage logs for ${c.name}${olderThan ? ` older than ${olderThan}` : ''}`);
      } catch (err) {
        console.error(`Failed to clear logs for ${c.name}:`, err);
      }
    }
    return { success: true, clearedCount: totalCleared };
  });

  ipcMain.handle(
    'mcpUsageLog:set-usage-tracking',
    async (_e: IpcMainInvokeEvent, clientName: string, enabled: boolean) => {
      const client = await registry.get(clientName);
      if (!client) throw new Error(`MCP client not found: ${clientName}`);
      console.log(`Setting usage tracking for ${clientName} to ${enabled}`);
      return { success: true };
    }
  );

  ipcMain.handle('mcpUsageLog:subscribe-usage-updates', async (_e: IpcMainInvokeEvent) => {
    const clients = await registry.getAll();
    for (const client of clients) {
      if (client.isUsageTrackingEnabled()) {
        const subscriptionId = `${client.name}-usage-subscription`;
        if (!usageSubscriptions.has(subscriptionId)) {
          let lastUsageCount = client.getMetadata().usageCount;
          const checkUsageChanges = () => {
            try {
              const currentUsageCount = client.getMetadata().usageCount;
              if (currentUsageCount > lastUsageCount) {
                const recentLogs = client.getUsageLogs().slice(-(currentUsageCount - lastUsageCount));
                recentLogs.forEach((log) => {
                  broadcastUsageEvent({
                    type: 'usage-logged',
                    clientName: client.name,
                    newLog: log,
                    timestamp: new Date(),
                  });
                });
                lastUsageCount = currentUsageCount;
              }
            } catch (err) {
              console.error(`Failed to check usage changes for ${client.name}:`, err);
            }
          };
          const interval = setInterval(checkUsageChanges, 2000);
          usageSubscriptions.set(subscriptionId, () => clearInterval(interval));
        }
      }
    }
    return () => {
      for (const [, unsubscribe] of usageSubscriptions) {
        unsubscribe();
      }
      usageSubscriptions.clear();
    };
  });

  console.log('MCP Usage Log IPC handlers registered');
}
