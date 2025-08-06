# Electron MCP IPC 통신 스펙

## 🎯 개요

AgentOS Core의 MCP 사용량 추적 기능을 Electron Main-Renderer 간 IPC 통신으로 연동하기 위한 포괄적인 스펙입니다.

## 🏗️ 아키텍처 원칙

### 1. 책임 분리
- **Main Process**: Core MCP 기능 실행, 사용량 추적, 상태 관리
- **Renderer Process**: UI 표시, 사용자 상호작용
- **IPC Layer**: 타입 안전한 데이터 전송, 실시간 동기화

### 2. 데이터 흐름
```
┌─────────────────┐    IPC     ┌─────────────────┐
│   Renderer      │◄──────────►│   Main Process  │
│   (GUI)         │   Events   │   (Core MCP)    │
└─────────────────┘            └─────────────────┘
         ▲                               ▲
         │ UI Updates                    │ Usage Data
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│ McpToolManager  │            │ InMemoryUsage   │
│ Component       │            │ Tracker         │
└─────────────────┘            └─────────────────┘
```

### 3. 실시간 동기화
- **Push 방식**: Main에서 Renderer로 상태 변경 알림
- **Pull 방식**: Renderer에서 필요 시 Main에 데이터 요청
- **Event Subscription**: 사용량 변경 시 즉시 알림

## 📋 IPC API 확장 스펙

### 기존 MCP API 확장

```typescript
// apps/gui/src/shared/types/electron-api.ts 확장

export interface McpAPI {
  // ==================== 기존 기본 기능들 ====================
  getAll: () => Promise<McpConfig[]>;
  connect: (config: McpConfig) => Promise<{ success: boolean }>;
  disconnect: (name: string) => Promise<{ success: boolean }>;
  executeTool: (clientName: string, toolName: string, args: any) => Promise<ToolExecutionResponse>;
  getResources: (clientName: string) => Promise<ResourceListResponse>;
  readResource: (clientName: string, uri: string) => Promise<ResourceResponse>;
  getStatus: (clientName: string) => Promise<{ connected: boolean; error?: string }>;

  // ==================== 새로운 사용량 추적 기능들 ====================
  
  /**
   * MCP 도구 메타데이터 조회
   */
  getToolMetadata: (clientName: string) => Promise<McpToolMetadata>;
  
  /**
   * 모든 MCP 도구들의 메타데이터 일괄 조회
   */
  getAllToolMetadata: () => Promise<McpToolMetadata[]>;
  
  /**
   * 특정 도구의 사용량 로그 조회
   */
  getUsageLogs: (clientName: string, options?: UsageLogQueryOptions) => Promise<McpUsageLog[]>;
  
  /**
   * 전체 사용량 로그 조회
   */
  getAllUsageLogs: (options?: UsageLogQueryOptions) => Promise<McpUsageLog[]>;
  
  /**
   * 사용량 통계 조회
   */
  getUsageStats: (clientName?: string) => Promise<McpUsageStats>;
  
  /**
   * 시간별 사용량 통계 조회
   */
  getHourlyStats: (date: Date, clientName?: string) => Promise<Map<number, number>>;
  
  /**
   * 기간별 사용량 로그 조회
   */
  getUsageLogsInRange: (startDate: Date, endDate: Date, clientName?: string) => Promise<McpUsageLog[]>;
  
  /**
   * 사용량 로그 정리
   */
  clearUsageLogs: (olderThan?: Date) => Promise<{ success: boolean; clearedCount: number }>;
  
  /**
   * 사용량 추적 활성화/비활성화
   */
  setUsageTracking: (clientName: string, enabled: boolean) => Promise<{ success: boolean }>;
  
  /**
   * 사용량 변경 이벤트 구독
   */
  subscribeToUsageUpdates: (callback: (event: McpUsageUpdateEvent) => void) => Promise<() => void>;
}
```

### 새로운 데이터 타입들

```typescript
// apps/gui/src/shared/types/mcp-usage-types.ts (새 파일)

import { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';

/**
 * 사용량 로그 조회 옵션
 */
export interface UsageLogQueryOptions {
  /** 페이지네이션: 시작 인덱스 */
  offset?: number;
  /** 페이지네이션: 최대 항목 수 */
  limit?: number;
  /** 필터: 특정 상태만 조회 */
  status?: 'success' | 'error' | 'timeout';
  /** 필터: 특정 에이전트만 조회 */
  agentId?: string;
  /** 정렬: 시간순 (desc: 최신순, asc: 오래된순) */
  sortOrder?: 'desc' | 'asc';
}

/**
 * 사용량 업데이트 이벤트
 */
export interface McpUsageUpdateEvent {
  /** 이벤트 타입 */
  type: 'usage-logged' | 'metadata-updated' | 'connection-changed';
  /** 관련 MCP 클라이언트 이름 */
  clientName: string;
  /** 새로운 사용량 로그 (usage-logged 타입일 때) */
  newLog?: McpUsageLog;
  /** 업데이트된 메타데이터 (metadata-updated 타입일 때) */
  metadata?: McpToolMetadata;
  /** 연결 상태 (connection-changed 타입일 때) */
  connectionStatus?: 'connected' | 'disconnected' | 'error' | 'pending';
  /** 이벤트 발생 시간 */
  timestamp: Date;
}

/**
 * GUI용 확장 메타데이터 (기존 타입 확장)
 */
export interface GuiMcpToolMetadata extends McpToolMetadata {
  /** GUI 전용: React 아이콘 컴포넌트 */
  icon?: React.ReactNode;
  /** API 키 (GUI에서만 관리) */
  apiKey?: string;
}

/**
 * 사용량 대시보드 데이터
 */
export interface McpUsageDashboard {
  /** 전체 통계 */
  globalStats: McpUsageStats;
  /** 도구별 통계 */
  toolStats: Array<{
    clientName: string;
    metadata: McpToolMetadata;
    stats: McpUsageStats;
  }>;
  /** 최근 활동 로그 */
  recentLogs: McpUsageLog[];
  /** 시간별 사용량 (최근 24시간) */
  hourlyActivity: Map<number, number>;
  /** 에러율 높은 도구들 */
  problematicTools: Array<{
    clientName: string;
    errorRate: number;
    lastError: string;
  }>;
}
```

## 🔧 Main Process 구현

### MCP IPC Handlers 확장

```typescript
// apps/gui/src/main/services/mcp-ipc-handlers.ts 확장

import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import { McpRegistry } from '@agentos/core';
import { McpUsageUpdateEvent } from '../../shared/types/mcp-usage-types';

// 전역 상태 관리
let mcpRegistry: McpRegistry | null = null;
let mainWindow: BrowserWindow | null = null;
let usageSubscriptions: Map<string, () => void> = new Map();

// 사용량 이벤트를 Renderer로 전송
function broadcastUsageEvent(event: McpUsageUpdateEvent) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('mcp:usage-update', event);
  }
}

export function setupMcpIpcHandlers(window: BrowserWindow) {
  mainWindow = window;
  const registry = initializeMcpRegistry();

  // ==================== 새로운 사용량 추적 핸들러들 ====================

  // 도구 메타데이터 조회
  ipcMain.handle('mcp:get-tool-metadata', async (_event, clientName: string) => {
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
  });

  // 모든 도구 메타데이터 조회
  ipcMain.handle('mcp:get-all-tool-metadata', async (_event) => {
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

  // 사용량 로그 조회
  ipcMain.handle('mcp:get-usage-logs', async (_event, clientName: string, options: any) => {
    try {
      const client = await registry.get(clientName);
      if (!client) {
        throw new Error(`MCP client not found: ${clientName}`);
      }
      
      let logs = client.getUsageLogs();
      
      // 필터링 및 정렬 적용
      if (options?.status) {
        logs = logs.filter(log => log.status === options.status);
      }
      
      if (options?.agentId) {
        logs = logs.filter(log => log.agentId === options.agentId);
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
  });

  // 전체 사용량 로그 조회
  ipcMain.handle('mcp:get-all-usage-logs', async (_event, options: any) => {
    try {
      const clients = await registry.getAll();
      let allLogs: McpUsageLog[] = [];
      
      for (const client of clients) {
        try {
          const logs = client.getUsageLogs();
          allLogs = allLogs.concat(logs);
        } catch (error) {
          console.error(`Failed to get logs for ${client.name}:`, error);
        }
      }
      
      // 정렬 및 필터링 로직 적용 (위와 동일)
      // ... 생략 (동일한 필터링 로직)
      
      return allLogs;
    } catch (error) {
      console.error('Failed to get all usage logs:', error);
      throw error;
    }
  });

  // 사용량 통계 조회
  ipcMain.handle('mcp:get-usage-stats', async (_event, clientName?: string) => {
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
        const allStats = await Promise.all(
          clients.map(client => client.getUsageStats())
        );
        
        // 통계 집계
        const totalUsage = allStats.reduce((sum, stat) => sum + stat.totalUsage, 0);
        const totalErrors = allStats.reduce((sum, stat) => sum + stat.errorCount, 0);
        const totalDuration = allStats.reduce((sum, stat) => sum + (stat.averageDuration * stat.totalUsage), 0);
        const lastUsedTimes = allStats
          .map(stat => stat.lastUsedAt)
          .filter(Boolean)
          .map(date => date!.getTime());
          
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

  // 사용량 추적 설정
  ipcMain.handle('mcp:set-usage-tracking', async (_event, clientName: string, enabled: boolean) => {
    try {
      // 기존 클라이언트를 추적 활성화된 새 인스턴스로 교체
      const currentClient = await registry.get(clientName);
      if (!currentClient) {
        throw new Error(`MCP client not found: ${clientName}`);
      }
      
      // 설정 업데이트 로직 구현 필요
      // (현재 Core에서는 런타임 변경을 지원하지 않으므로 향후 구현)
      
      return { success: true };
    } catch (error) {
      console.error('Failed to set usage tracking:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 사용량 업데이트 구독 설정
  ipcMain.handle('mcp:subscribe-usage-updates', async (_event) => {
    try {
      // 모든 클라이언트의 사용량 변경 이벤트 구독
      const clients = await registry.getAll();
      
      for (const client of clients) {
        if (client.isUsageTrackingEnabled()) {
          // Core에서 이벤트를 발생시키도록 수정 필요
          // 현재는 polling 방식으로 대체
          const subscriptionId = `${client.name}-usage-subscription`;
          
          if (!usageSubscriptions.has(subscriptionId)) {
            let lastUsageCount = client.getMetadata().usageCount;
            
            const checkUsageChanges = () => {
              const currentUsageCount = client.getMetadata().usageCount;
              if (currentUsageCount > lastUsageCount) {
                const recentLogs = client.getUsageLogs().slice(-(currentUsageCount - lastUsageCount));
                
                recentLogs.forEach(log => {
                  broadcastUsageEvent({
                    type: 'usage-logged',
                    clientName: client.name,
                    newLog: log,
                    timestamp: new Date(),
                  });
                });
                
                lastUsageCount = currentUsageCount;
              }
            };
            
            const interval = setInterval(checkUsageChanges, 1000); // 1초마다 체크
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

// 정리 함수
export function cleanupMcpIpcHandlers() {
  usageSubscriptions.forEach(unsubscribe => unsubscribe());
  usageSubscriptions.clear();
  mainWindow = null;
}
```

## 🎨 Renderer Process 구현

### MCP Service 확장

```typescript
// apps/gui/src/renderer/services/mcp-service.ts 확장

import type { IpcChannel } from './ipc/IpcChannel';
import type { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';
import type { 
  McpUsageUpdateEvent, 
  UsageLogQueryOptions,
  McpUsageDashboard 
} from '../../shared/types/mcp-usage-types';

export class McpService {
  private usageUpdateSubscription?: () => void;
  private usageUpdateCallbacks: Set<(event: McpUsageUpdateEvent) => void> = new Set();

  constructor(private ipcChannel: IpcChannel) {
    this.initializeUsageUpdates();
  }

  // ==================== 사용량 추적 메서드들 ====================

  async getToolMetadata(clientName: string): Promise<McpToolMetadata> {
    return this.ipcChannel.getToolMetadata(clientName);
  }

  async getAllToolMetadata(): Promise<McpToolMetadata[]> {
    return this.ipcChannel.getAllToolMetadata();
  }

  async getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.ipcChannel.getUsageLogs(clientName, options);
  }

  async getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.ipcChannel.getAllUsageLogs(options);
  }

  async getUsageStats(clientName?: string): Promise<McpUsageStats> {
    return this.ipcChannel.getUsageStats(clientName);
  }

  async clearUsageLogs(olderThan?: Date): Promise<{ success: boolean; clearedCount: number }> {
    return this.ipcChannel.clearUsageLogs(olderThan);
  }

  // ==================== 실시간 업데이트 관리 ====================

  private async initializeUsageUpdates() {
    try {
      this.usageUpdateSubscription = await this.ipcChannel.subscribeToUsageUpdates(
        (event: McpUsageUpdateEvent) => {
          this.usageUpdateCallbacks.forEach(callback => {
            try {
              callback(event);
            } catch (error) {
              console.error('Error in usage update callback:', error);
            }
          });
        }
      );
    } catch (error) {
      console.error('Failed to initialize usage updates:', error);
    }
  }

  onUsageUpdate(callback: (event: McpUsageUpdateEvent) => void): () => void {
    this.usageUpdateCallbacks.add(callback);
    
    return () => {
      this.usageUpdateCallbacks.delete(callback);
    };
  }

  // ==================== 고급 유틸리티 메서드들 ====================

  async getDashboardData(): Promise<McpUsageDashboard> {
    const [globalStats, allMetadata, recentLogs] = await Promise.all([
      this.getUsageStats(),
      this.getAllToolMetadata(),
      this.getAllUsageLogs({ limit: 50, sortOrder: 'desc' })
    ]);

    const toolStats = await Promise.all(
      allMetadata.map(async (metadata) => ({
        clientName: metadata.name,
        metadata,
        stats: await this.getUsageStats(metadata.name),
      }))
    );

    // 시간별 활동 계산
    const now = new Date();
    const hourlyActivity = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyActivity.set(i, 0);
    }

    recentLogs
      .filter(log => {
        const logDate = log.timestamp;
        return logDate.getDate() === now.getDate() &&
               logDate.getMonth() === now.getMonth() &&
               logDate.getFullYear() === now.getFullYear();
      })
      .forEach(log => {
        const hour = log.timestamp.getHours();
        hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
      });

    // 에러율 높은 도구들
    const problematicTools = toolStats
      .filter(tool => tool.stats.totalUsage > 0 && tool.stats.errorCount > 0)
      .map(tool => ({
        clientName: tool.clientName,
        errorRate: tool.stats.errorCount / tool.stats.totalUsage,
        lastError: recentLogs
          .filter(log => log.toolId === tool.metadata.id && log.status === 'error')
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.error || 'Unknown error'
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);

    return {
      globalStats,
      toolStats,
      recentLogs,
      hourlyActivity,
      problematicTools,
    };
  }

  dispose() {
    if (this.usageUpdateSubscription) {
      this.usageUpdateSubscription();
      this.usageUpdateSubscription = undefined;
    }
    this.usageUpdateCallbacks.clear();
  }
}
```

## 🔧 IPC Channel 인터페이스 확장

```typescript
// apps/gui/src/renderer/services/ipc/IpcChannel.ts 확장

export interface IpcChannel {
  // ... 기존 메서드들 ...

  // ==================== MCP 사용량 추적 메서드들 ====================
  
  getToolMetadata(clientName: string): Promise<McpToolMetadata>;
  getAllToolMetadata(): Promise<McpToolMetadata[]>;
  getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;
  getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;
  getUsageStats(clientName?: string): Promise<McpUsageStats>;
  getHourlyStats(date: Date, clientName?: string): Promise<Map<number, number>>;
  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]>;
  clearUsageLogs(olderThan?: Date): Promise<{ success: boolean; clearedCount: number }>;
  setUsageTracking(clientName: string, enabled: boolean): Promise<{ success: boolean }>;
  subscribeToUsageUpdates(callback: (event: McpUsageUpdateEvent) => void): Promise<() => void>;
}
```

## 🎯 사용 예시

### React 컴포넌트에서의 활용

```typescript
// 실시간 사용량 데이터를 보여주는 컴포넌트 예시

import { useEffect, useState } from 'react';
import { useServiceContainer } from '../hooks/useServiceContainer';
import { McpUsageDashboard, McpUsageUpdateEvent } from '../types/mcp-usage-types';

export function McpUsageDashboard() {
  const { mcpService } = useServiceContainer();
  const [dashboard, setDashboard] = useState<McpUsageDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 데이터 로드
    const loadDashboard = async () => {
      try {
        const data = await mcpService.getDashboardData();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();

    // 실시간 업데이트 구독
    const unsubscribe = mcpService.onUsageUpdate((event: McpUsageUpdateEvent) => {
      if (event.type === 'usage-logged') {
        // 새로운 사용량이 로깅되면 대시보드 데이터 새로고침
        loadDashboard();
      }
    });

    return unsubscribe;
  }, [mcpService]);

  if (isLoading) return <div>Loading...</div>;
  if (!dashboard) return <div>No data available</div>;

  return (
    <div className="mcp-usage-dashboard">
      <div className="stats-overview">
        <div>Total Usage: {dashboard.globalStats.totalUsage}</div>
        <div>Success Rate: {(dashboard.globalStats.successRate * 100).toFixed(1)}%</div>
        <div>Average Duration: {dashboard.globalStats.averageDuration.toFixed(0)}ms</div>
      </div>
      
      {/* 시간별 차트, 도구별 통계, 최근 로그 등 UI 컴포넌트들 */}
    </div>
  );
}
```

## 🚀 다음 단계

1. **타입 안전성 강화**: 모든 IPC 통신에 대한 엄격한 타입 검증
2. **에러 처리**: IPC 통신 실패, 네트워크 오류 등에 대한 견고한 처리
3. **성능 최적화**: 대량의 사용량 데이터 전송 시 배치 처리, 압축
4. **보안 강화**: IPC 채널 보안, 데이터 무결성 검증
5. **테스트**: IPC 통신 Mock, E2E 테스트 환경 구축

이 스펙을 통해 Core의 MCP 사용량 추적 기능이 GUI에서 실시간으로 활용될 수 있는 완전한 아키텍처를 제공합니다.