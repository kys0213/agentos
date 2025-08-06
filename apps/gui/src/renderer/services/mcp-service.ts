import type { IpcChannel } from './ipc/IpcChannel';
import type {
  McpConfig,
  ToolExecutionResponse,
  ResourceListResponse,
  ResourceResponse,
} from '../types/core-types';
import type { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  McpUsageUpdateEvent,
  UsageLogQueryOptions,
  McpUsageDashboard,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
} from '../../shared/types/mcp-usage-types';

/**
 * MCP 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class McpService {
  private usageUpdateSubscription?: () => void;
  private usageUpdateCallbacks: Set<(event: McpUsageUpdateEvent) => void> = new Set();

  constructor(private ipcChannel: IpcChannel) {
    this.initializeUsageUpdates();
  }

  // ==================== 기본 MCP 메서드들 ====================

  async getAll(): Promise<McpConfig[]> {
    return this.ipcChannel.getAllMcp();
  }

  async connect(config: McpConfig): Promise<{ success: boolean }> {
    return this.ipcChannel.connectMcp(config);
  }

  async disconnect(name: string): Promise<{ success: boolean }> {
    return this.ipcChannel.disconnectMcp(name);
  }

  async executeTool(
    clientName: string,
    toolName: string,
    args: any
  ): Promise<ToolExecutionResponse> {
    return this.ipcChannel.executeMcpTool(clientName, toolName, args);
  }

  async getResources(clientName: string): Promise<ResourceListResponse> {
    return this.ipcChannel.getMcpResources(clientName);
  }

  async readResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.ipcChannel.readMcpResource(clientName, uri);
  }

  async getStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.ipcChannel.getMcpStatus(clientName);
  }

  // ==================== 편의 메서드들 ====================

  /**
   * 특정 이름의 MCP 클라이언트가 연결되어 있는지 확인
   */
  async isConnected(name: string): Promise<boolean> {
    try {
      const status = await this.getStatus(name);
      return status.connected;
    } catch {
      return false;
    }
  }

  /**
   * 연결된 MCP 클라이언트 수 반환
   */
  async getConnectedCount(): Promise<number> {
    const clients = await this.getAll();
    let connectedCount = 0;

    for (const client of clients) {
      const isConnected = await this.isConnected(client.name);
      if (isConnected) {
        connectedCount++;
      }
    }

    return connectedCount;
  }

  /**
   * 특정 클라이언트의 모든 리소스를 URI 목록으로 반환
   */
  async getResourceUris(clientName: string): Promise<string[]> {
    const resources = await this.getResources(clientName);
    return resources.resources.map((resource) => resource.uri);
  }

  /**
   * MCP 클라이언트 설정을 이름으로 조회
   */
  async getConfigByName(name: string): Promise<McpConfig | null> {
    const clients = await this.getAll();
    return clients.find((client) => client.name === name) || null;
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

  async getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse> {
    return this.ipcChannel.getHourlyStats(date, clientName);
  }

  async getUsageLogsInRange(
    startDate: Date,
    endDate: Date,
    clientName?: string
  ): Promise<McpUsageLog[]> {
    return this.ipcChannel.getUsageLogsInRange(startDate, endDate, clientName);
  }

  async clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return this.ipcChannel.clearUsageLogs(olderThan);
  }

  async setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse> {
    return this.ipcChannel.setUsageTracking(clientName, enabled);
  }

  // ==================== 실시간 업데이트 관리 ====================

  private async initializeUsageUpdates() {
    try {
      this.usageUpdateSubscription = await this.ipcChannel.subscribeToUsageUpdates(
        (event: McpUsageUpdateEvent) => {
          this.usageUpdateCallbacks.forEach((callback) => {
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
      this.getAllUsageLogs({ limit: 50, sortOrder: 'desc' }),
    ]);

    const toolStats = await Promise.all(
      allMetadata.map(async (metadata) => ({
        clientName: metadata.name,
        metadata,
        stats: await this.getUsageStats(metadata.name),
      }))
    );

    // 시간별 활동 계산 (오늘 기준)
    const now = new Date();
    const hourlyStatsResponse = await this.getHourlyStats(now);
    const hourlyActivity = new Map<number, number>();

    hourlyStatsResponse.hourlyData.forEach(([hour, count]) => {
      hourlyActivity.set(hour, count);
    });

    // 에러율 높은 도구들
    const problematicTools = toolStats
      .filter((tool) => tool.stats.totalUsage > 0 && tool.stats.errorCount > 0)
      .map((tool) => ({
        clientName: tool.clientName,
        errorRate: tool.stats.errorCount / tool.stats.totalUsage,
        lastError:
          recentLogs
            .filter((log) => log.toolId === tool.metadata.id && log.status === 'error')
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.error ||
          'Unknown error',
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

  /**
   * 특정 기간 동안의 사용량 트렌드 분석
   */
  async getUsageTrend(
    days: number = 7,
    clientName?: string
  ): Promise<{
    dailyUsage: Array<{ date: string; count: number }>;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const logs = await this.getUsageLogsInRange(startDate, endDate, clientName);

    // 날짜별 사용량 집계
    const dailyUsage: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayLogs = logs.filter((log) => log.timestamp.toISOString().split('T')[0] === dateStr);

      dailyUsage.push({ date: dateStr, count: dayLogs.length });
    }

    // 트렌드 계산 (첫 절반 vs 둘째 절반 비교)
    const firstHalf = dailyUsage.slice(0, Math.floor(days / 2));
    const secondHalf = dailyUsage.slice(Math.floor(days / 2));

    const firstAvg = firstHalf.reduce((sum, day) => sum + day.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, day) => sum + day.count, 0) / secondHalf.length;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;

    if (firstAvg > 0) {
      changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
      if (Math.abs(changePercent) > 10) {
        trend = changePercent > 0 ? 'up' : 'down';
      }
    }

    return {
      dailyUsage,
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  /**
   * 리소스 정리
   */
  dispose() {
    if (this.usageUpdateSubscription) {
      this.usageUpdateSubscription();
      this.usageUpdateSubscription = undefined;
    }
    this.usageUpdateCallbacks.clear();
  }
}
