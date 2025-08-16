import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import {
  McpService,
  FileMcpToolRepository,
  McpMetadataRegistry,
  type McpConfig,
  type McpToolMetadata,
  McpRegistry,
} from '@agentos/core';

let mcpService: McpService | null = null;

async function initializeMcpService(): Promise<McpService> {
  if (mcpService) return mcpService;

  // MCP Service 의존성 설정
  const repository = new FileMcpToolRepository(
    process.platform === 'win32'
      ? `${process.env.APPDATA}/.agentos/mcp/mcp-tools.json`
      : `${process.env.HOME}/.agentos/mcp/mcp-tools.json`
  );
  const registry = new McpMetadataRegistry(repository, new McpRegistry());
  mcpService = new McpService(repository, registry);

  // 서비스 초기화
  await mcpService.initialize();

  console.log('MCP service initialized');
  return mcpService;
}

export function setupMcpIpcHandlers(window?: BrowserWindow) {
  // window 파라미터는 현재 사용하지 않음 (향후 이벤트 브로드캐스트용)

  // IpcChannel 인터페이스에 맞춘 MCP 핸들러들

  // getAllMcp - 모든 MCP 도구 메타데이터 조회
  ipcMain.handle('mcp:get-all', async (_event: IpcMainInvokeEvent) => {
    try {
      const service = await initializeMcpService();
      const result = service.getAllTools();
      // GUI가 기대하는 McpConfig[] 형식으로 변환
      return result.items.map(
        (tool: McpToolMetadata) =>
          ({
            type: tool.config?.type || 'stdio',
            name: tool.name,
            version: tool.version,
            ...(tool.config || {}),
          }) as McpConfig
      );
    } catch (error) {
      console.error('Failed to get MCP tools:', error);
      throw error;
    }
  });

  // connectMcp - MCP 도구 등록 및 연결
  ipcMain.handle('mcp:connect', async (_event: IpcMainInvokeEvent, config: McpConfig) => {
    try {
      const service = await initializeMcpService();
      await service.registerTool(config);
      return { success: true };
    } catch (error) {
      console.error('Failed to register MCP tool:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // disconnectMcp - MCP 도구 연결 해제
  ipcMain.handle('mcp:disconnect', async (_event: IpcMainInvokeEvent, name: string) => {
    try {
      const service = await initializeMcpService();
      // 이름으로 도구 찾기
      const tools = service
        .getAllTools()
        .items.filter((tool: McpToolMetadata) => tool.name === name);
      if (tools.length === 0) {
        throw new Error(`MCP tool not found: ${name}`);
      }

      await service.unregisterTool(tools[0].id);
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect MCP tool:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // executeMcpTool - MCP 도구 실행 (현재 지원하지 않음)
  ipcMain.handle(
    'mcp:execute-tool',
    async (_event: IpcMainInvokeEvent, clientName: string, toolName: string, args: any) => {
      try {
        // TODO: McpService에 executeTool 메서드 추가 필요
        console.log(`Tool execution requested: ${clientName}.${toolName}`, args);
        return {
          success: false,
          result: undefined,
          error: 'Tool execution not yet implemented in new MCP Service',
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

  // getMcpResources - MCP 리소스 조회 (현재 지원하지 않음)
  ipcMain.handle('mcp:get-resources', async (_event: IpcMainInvokeEvent, clientName: string) => {
    try {
      // TODO: McpService에 getResources 메서드 추가 필요
      console.log(`Resources requested for client: ${clientName}`);
      return {
        resources: [],
      };
    } catch (error) {
      console.error('Failed to get MCP resources:', error);
      throw error;
    }
  });

  // readMcpResource - MCP 리소스 읽기 (현재 지원하지 않음)
  ipcMain.handle(
    'mcp:read-resource',
    async (_event: IpcMainInvokeEvent, clientName: string, uri: string) => {
      try {
        // TODO: McpService에 getResource 메서드 추가 필요
        console.log(`Resource read requested: ${uri} from client: ${clientName}`);
        return {
          uri,
          mimeType: 'text/plain',
          content: 'Resource reading not yet implemented in new MCP Service',
        };
      } catch (error) {
        console.error('Failed to read MCP resource:', error);
        throw error;
      }
    }
  );

  // getMcpStatus - MCP 도구 상태 조회
  ipcMain.handle('mcp:get-status', async (_event: IpcMainInvokeEvent, clientName: string) => {
    try {
      const service = await initializeMcpService();
      const tools = service
        .getAllTools()
        .items.filter((tool: McpToolMetadata) => tool.name === clientName);
      if (tools.length === 0) {
        return {
          connected: false,
          error: `MCP tool not found: ${clientName}`,
        };
      }

      const tool = tools[0];
      return {
        connected: tool.status === 'connected',
        error: tool.status === 'error' ? 'Connection error' : undefined,
      };
    } catch (error) {
      console.error('Failed to get MCP status:', error);
      return {
        connected: false,
        error: (error as Error).message,
      };
    }
  });

  // ==================== 메타데이터 및 통계 핸들러들 ====================

  // getToolMetadata - 도구 메타데이터 조회
  ipcMain.handle(
    'mcp:get-tool-metadata',
    async (_event: IpcMainInvokeEvent, clientName: string) => {
      try {
        const service = await initializeMcpService();
        const tools = service
          .getAllTools()
          .items.filter((tool: McpToolMetadata) => tool.name === clientName);
        if (tools.length === 0) {
          throw new Error(`MCP tool not found: ${clientName}`);
        }

        return tools[0];
      } catch (error) {
        console.error('Failed to get tool metadata:', error);
        throw error;
      }
    }
  );

  // getAllToolMetadata - 모든 도구 메타데이터 조회
  ipcMain.handle('mcp:get-all-tool-metadata', async (_event: IpcMainInvokeEvent) => {
    try {
      const service = await initializeMcpService();
      const result = service.getAllTools();
      return result.items;
    } catch (error) {
      console.error('Failed to get all tool metadata:', error);
      throw error;
    }
  });

  // getUsageStats - 사용량 통계 조회
  ipcMain.handle('mcp:get-usage-stats', async (_event: IpcMainInvokeEvent, clientName?: string) => {
    try {
      const service = await initializeMcpService();
      const stats = service.getStatistics();

      if (clientName) {
        // 특정 도구의 통계 반환 (현재는 전체 통계만 지원)
        const tools = service
          .getAllTools()
          .items.filter((tool: McpToolMetadata) => tool.name === clientName);
        if (tools.length === 0) {
          throw new Error(`MCP tool not found: ${clientName}`);
        }

        const tool = tools[0];
        return {
          totalUsage: tool.usageCount,
          successRate: 1.0, // TODO: 실제 성공률 계산
          averageDuration: 0, // TODO: 평균 실행 시간
          lastUsedAt: tool.lastUsedAt,
          errorCount: 0, // TODO: 오류 카운트
        };
      } else {
        // 전체 통계
        return {
          totalUsage: stats.total,
          successRate: stats.total > 0 ? stats.connected / stats.total : 0,
          averageDuration: 0,
          lastUsedAt: undefined,
          errorCount: stats.error,
        };
      }
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      throw error;
    }
  });

  // ==================== TODO: 향후 구현 예정 핸들러들 ====================

  // 사용량 로그 조회 (현재 McpService에서 지원하지 않음)
  ipcMain.handle(
    'mcp:get-usage-logs',
    async (_event: IpcMainInvokeEvent, clientName: string, options?: any) => {
      console.log(`Getting usage logs for ${clientName}:`, options);
      return []; // TODO: McpService에 사용량 로그 기능이 추가되면 구현
    }
  );

  // 모든 사용량 로그 조회 (현재 지원하지 않음)
  ipcMain.handle('mcp:get-all-usage-logs', async (_event: IpcMainInvokeEvent, options?: any) => {
    console.log('Getting all usage logs:', options);
    return []; // TODO: McpService에 사용량 로그 기능이 추가되면 구현
  });

  // 시간별 통계 (현재 지원하지 않음)
  ipcMain.handle(
    'mcp:get-hourly-stats',
    async (_event: IpcMainInvokeEvent, date: string, clientName?: string) => {
      const hourlyData: Array<[number, number]> = [];
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.push([hour, 0]);
      }

      console.log(`Getting hourly stats for date ${date}, client: ${clientName}`);
      return { hourlyData }; // TODO: McpService에 시간별 통계 기능이 추가되면 구현
    }
  );

  // 범위 내 사용량 로그 (현재 지원하지 않음)
  ipcMain.handle(
    'mcp:get-usage-logs-in-range',
    async (_event: IpcMainInvokeEvent, startDate: string, endDate: string, clientName?: string) => {
      console.log(`Getting usage logs from ${startDate} to ${endDate}, client: ${clientName}`);
      return []; // TODO: McpService에 날짜 범위 로그 기능이 추가되면 구현
    }
  );

  // 사용량 로그 정리 (현재 지원하지 않음)
  ipcMain.handle('mcp:clear-usage-logs', async (_event: IpcMainInvokeEvent, olderThan?: string) => {
    console.log(`Clearing usage logs${olderThan ? ` older than ${olderThan}` : ''}`);

    return {
      success: true,
      clearedCount: 0,
    }; // TODO: McpService에 로그 정리 기능이 추가되면 구현
  });

  // 사용량 추적 설정 (현재 지원하지 않음)
  ipcMain.handle(
    'mcp:set-usage-tracking',
    async (_event: IpcMainInvokeEvent, clientName: string, enabled: boolean) => {
      console.log(`Setting usage tracking for ${clientName} to ${enabled}`);

      return { success: true }; // TODO: McpService에 사용량 추적 설정 기능이 추가되면 구현
    }
  );

  // 사용량 업데이트 구독 (현재 지원하지 않음)
  ipcMain.handle('mcp:subscribe-usage-updates', async (_event: IpcMainInvokeEvent) => {
    console.log('Subscribing to usage updates');

    // TODO: McpService 이벤트 시스템을 사용한 사용량 업데이트 구독 구현
    // const service = await initializeMcpService();
    // service.on('toolUsageIncremented', (event) => {
    //   if (mainWindow && !mainWindow.isDestroyed()) {
    //     mainWindow.webContents.send('mcp:usage-update', {
    //       type: 'usage-logged',
    //       clientName: event.toolId,
    //       newLog: event,
    //       timestamp: new Date(),
    //     });
    //   }
    // });

    return { success: true };
  });
}

/**
 * 정리 함수
 */
export function cleanupMcpIpcHandlers() {
  mcpService = null;
}
