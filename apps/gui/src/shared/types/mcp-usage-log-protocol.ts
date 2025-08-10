import type { McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  UsageLogQueryOptions,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
  McpUsageUpdateEvent,
} from './mcp-usage-types';

export interface McpUsageLogProtocol {
  /**
   * 사용량 로그 조회
   */
  getUsageLogs(clientName: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;

  /**
   * 전체 사용량 로그 조회
   */
  getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]>;

  /**
   * 사용량 통계 조회
   */
  getUsageStats(clientName?: string): Promise<McpUsageStats>;

  /**
   * 시간별 사용량 통계 조회
   */
  getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse>;

  /**
   * 기간별 사용량 로그 조회
   */
  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]>;

  /**
   * 사용량 로그 정리
   */
  clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse>;

  /**
   * 사용량 추적 활성화/비활성화
   */
  setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse>;

  /**
   * 사용량 변경 이벤트 구독
   */
  subscribeToUsageUpdates(callback: (event: McpUsageUpdateEvent) => void): Promise<() => void>;
}
