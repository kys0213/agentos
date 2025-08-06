import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import { McpRegistry } from '@agentos/core';
import type { McpUsageUpdateEvent } from '../../shared/types/mcp-usage-types';

let mcpRegistry: McpRegistry | null = null;
let mainWindow: BrowserWindow | null = null;
const usageSubscriptions: Map<string, () => void> = new Map();

function initializeMcpRegistry(): McpRegistry {
  if (mcpRegistry) return mcpRegistry;

  mcpRegistry = new McpRegistry();

  console.log('MCP registry initialized');
  return mcpRegistry;
}

/**
 * 사용량 이벤트를 Renderer로 전송
 */
function broadcastUsageEvent(event: McpUsageUpdateEvent) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('mcp:usage-update', event);
  }
}

export function setupMcpIpcHandlers(window?: BrowserWindow) {
  if (window) {
    mainWindow = window;
  }

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

  // ==================== 새로운 사용량 추적 핸들러들 ====================

  // getToolMetadata
  ipcMain.handle(
    'mcp:get-tool-metadata',
    async (_event: IpcMainInvokeEvent, clientName: string) => {
      try {
        const client = await registry.get(clientName);
        if (!client) {
          throw new Error(`MCP client not found: ${clientName}`);
        }

        const metadata = client.getMetadata();
        return metadata;
      } catch (error) {
        console.error('Failed to get tool metadata:', error);
        throw error;
      }
    }
  );

  // getAllToolMetadata
  ipcMain.handle('mcp:get-all-tool-metadata', async (_event: IpcMainInvokeEvent) => {
    try {
      const clients = await registry.getAll();
      const metadataList = await Promise.all(
        clients.map(async (client) => {
          try {
            return client.getMetadata();
          } catch (error) {
            console.error(`Failed to get metadata for ${client.name}:`, error);
            return null;
          }
        })
      );

      return metadataList.filter(Boolean);
    } catch (error) {
      console.error('Failed to get all tool metadata:', error);
      throw error;
    }
  });

  // getUsageLogs
  ipcMain.handle(
    'mcp:get-usage-logs',
    async (_event: IpcMainInvokeEvent, clientName: string, options?: any) => {
      try {
        const client = await registry.get(clientName);
        if (!client) {
          throw new Error(`MCP client not found: ${clientName}`);
        }

        let logs = client.getUsageLogs();

        // 필터링 및 정렬 적용
        if (options?.status) {
          logs = logs.filter((log) => log.status === options.status);
        }

        if (options?.agentId) {
          logs = logs.filter((log) => log.agentId === options.agentId);
        }

        if (options?.sortOrder === 'asc') {
          logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        } else {
          logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }

        // 페이지네이션 적용
        if (options?.offset !== undefined || options?.limit !== undefined) {
          const offset = options.offset || 0;
          const limit = options.limit || 50;
          logs = logs.slice(offset, offset + limit);
        }

        return logs;
      } catch (error) {
        console.error('Failed to get usage logs:', error);
        throw error;
      }
    }
  );

  // getAllUsageLogs
  ipcMain.handle('mcp:get-all-usage-logs', async (_event: IpcMainInvokeEvent, options?: any) => {
    try {
      const clients = await registry.getAll();
      let allLogs: any[] = [];

      for (const client of clients) {
        try {
          const logs = client.getUsageLogs();
          allLogs = allLogs.concat(logs);
        } catch (error) {
          console.error(`Failed to get logs for ${client.name}:`, error);
        }
      }

      // 정렬 및 필터링 로직 적용
      if (options?.status) {
        allLogs = allLogs.filter((log) => log.status === options.status);
      }

      if (options?.agentId) {
        allLogs = allLogs.filter((log) => log.agentId === options.agentId);
      }

      if (options?.sortOrder === 'asc') {
        allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      } else {
        allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }

      // 페이지네이션 적용
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0;
        const limit = options.limit || 50;
        allLogs = allLogs.slice(offset, offset + limit);
      }

      return allLogs;
    } catch (error) {
      console.error('Failed to get all usage logs:', error);
      throw error;
    }
  });

  // getUsageStats
  ipcMain.handle('mcp:get-usage-stats', async (_event: IpcMainInvokeEvent, clientName?: string) => {
    try {
      if (clientName) {
        const client = await registry.get(clientName);
        if (!client) {
          throw new Error(`MCP client not found: ${clientName}`);
        }
        return client.getUsageStats();
      } else {
        // 전체 통계 계산
        const clients = await registry.getAll();
        const allStats = await Promise.all(clients.map((client) => client.getUsageStats()));

        // 통계 집계
        const totalUsage = allStats.reduce((sum, stat) => sum + stat.totalUsage, 0);
        const totalErrors = allStats.reduce((sum, stat) => sum + stat.errorCount, 0);
        const totalDuration = allStats.reduce(
          (sum, stat) => sum + stat.averageDuration * stat.totalUsage,
          0
        );
        const lastUsedTimes = allStats
          .map((stat) => stat.lastUsedAt)
          .filter(Boolean)
          .map((date) => date!.getTime());

        return {
          totalUsage,
          successRate: totalUsage > 0 ? (totalUsage - totalErrors) / totalUsage : 0,
          averageDuration: totalUsage > 0 ? totalDuration / totalUsage : 0,
          lastUsedAt: lastUsedTimes.length > 0 ? new Date(Math.max(...lastUsedTimes)) : undefined,
          errorCount: totalErrors,
        };
      }
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      throw error;
    }
  });

  // getHourlyStats
  ipcMain.handle(
    'mcp:get-hourly-stats',
    async (_event: IpcMainInvokeEvent, date: string, clientName?: string) => {
      try {
        const targetDate = new Date(date);
        const hourlyData: Array<[number, number]> = [];

        // 24시간 초기화
        for (let hour = 0; hour < 24; hour++) {
          hourlyData.push([hour, 0]);
        }

        if (clientName) {
          const client = await registry.get(clientName);
          if (!client) {
            throw new Error(`MCP client not found: ${clientName}`);
          }

          const logs = client.getUsageLogs();
          logs
            .filter((log) => {
              const logDate = log.timestamp;
              return (
                logDate.getDate() === targetDate.getDate() &&
                logDate.getMonth() === targetDate.getMonth() &&
                logDate.getFullYear() === targetDate.getFullYear()
              );
            })
            .forEach((log) => {
              const hour = log.timestamp.getHours();
              hourlyData[hour][1]++;
            });
        } else {
          // 모든 클라이언트 통합
          const clients = await registry.getAll();
          for (const client of clients) {
            try {
              const logs = client.getUsageLogs();
              logs
                .filter((log) => {
                  const logDate = log.timestamp;
                  return (
                    logDate.getDate() === targetDate.getDate() &&
                    logDate.getMonth() === targetDate.getMonth() &&
                    logDate.getFullYear() === targetDate.getFullYear()
                  );
                })
                .forEach((log) => {
                  const hour = log.timestamp.getHours();
                  hourlyData[hour][1]++;
                });
            } catch (error) {
              console.error(`Failed to get hourly stats for ${client.name}:`, error);
            }
          }
        }

        return { hourlyData };
      } catch (error) {
        console.error('Failed to get hourly stats:', error);
        throw error;
      }
    }
  );

  // getUsageLogsInRange
  ipcMain.handle(
    'mcp:get-usage-logs-in-range',
    async (_event: IpcMainInvokeEvent, startDate: string, endDate: string, clientName?: string) => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let allLogs: any[] = [];

        if (clientName) {
          const client = await registry.get(clientName);
          if (!client) {
            throw new Error(`MCP client not found: ${clientName}`);
          }

          allLogs = client.getUsageLogs();
        } else {
          const clients = await registry.getAll();
          for (const client of clients) {
            try {
              const logs = client.getUsageLogs();
              allLogs = allLogs.concat(logs);
            } catch (error) {
              console.error(`Failed to get logs for ${client.name}:`, error);
            }
          }
        }

        // 날짜 범위 필터링
        const filteredLogs = allLogs.filter((log) => {
          const logTime = log.timestamp.getTime();
          return logTime >= start.getTime() && logTime <= end.getTime();
        });

        return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      } catch (error) {
        console.error('Failed to get usage logs in range:', error);
        throw error;
      }
    }
  );

  // clearUsageLogs
  ipcMain.handle('mcp:clear-usage-logs', async (_event: IpcMainInvokeEvent, olderThan?: string) => {
    try {
      const clients = await registry.getAll();
      let totalCleared = 0;

      for (const client of clients) {
        try {
          // TODO: Core에 clearUsageLogs 메서드가 구현되면 실제 정리 로직 추가
          // 현재는 시뮬레이션
          console.log(
            `Clearing usage logs for ${client.name}${olderThan ? ` older than ${olderThan}` : ''}`
          );
          totalCleared += 0; // 실제 구현 시 삭제된 로그 수 반환
        } catch (error) {
          console.error(`Failed to clear logs for ${client.name}:`, error);
        }
      }

      return {
        success: true,
        clearedCount: totalCleared,
      };
    } catch (error) {
      console.error('Failed to clear usage logs:', error);
      return {
        success: false,
        clearedCount: 0,
        error: (error as Error).message,
      };
    }
  });

  // setUsageTracking
  ipcMain.handle(
    'mcp:set-usage-tracking',
    async (_event: IpcMainInvokeEvent, clientName: string, enabled: boolean) => {
      try {
        const client = await registry.get(clientName);
        if (!client) {
          throw new Error(`MCP client not found: ${clientName}`);
        }

        // TODO: Core에서 런타임 사용량 추적 설정 변경이 지원되면 구현
        console.log(`Setting usage tracking for ${clientName} to ${enabled}`);

        return { success: true };
      } catch (error) {
        console.error('Failed to set usage tracking:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // subscribeToUsageUpdates
  ipcMain.handle('mcp:subscribe-usage-updates', async (_event: IpcMainInvokeEvent) => {
    try {
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
                  const recentLogs = client
                    .getUsageLogs()
                    .slice(-(currentUsageCount - lastUsageCount));

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
              } catch (error) {
                console.error(`Error checking usage changes for ${client.name}:`, error);
              }
            };

            const interval = setInterval(checkUsageChanges, 1000);
            usageSubscriptions.set(subscriptionId, () => clearInterval(interval));
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to subscribe to usage updates:', error);
      throw error;
    }
  });
}

/**
 * 정리 함수
 */
export function cleanupMcpIpcHandlers() {
  usageSubscriptions.forEach((unsubscribe) => unsubscribe());
  usageSubscriptions.clear();
  mainWindow = null;
}
