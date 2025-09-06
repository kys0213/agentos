import { McpUsageTracker, McpUsageLog, McpUsageStats } from './mcp-types';

/**
 * 사용량 추적을 비활성화한 더미 구현
 * usageTrackingEnabled: false 일 때 사용됩니다.
 */

export class NoOpUsageTracker implements McpUsageTracker {
  trackUsage(_log: Omit<McpUsageLog, 'id' | 'timestamp'>): void {
    // 아무것도 하지 않음
  }

  getUsageLogs(_toolId?: string): McpUsageLog[] {
    return [];
  }

  getUsageStats(_toolId?: string): McpUsageStats {
    return {
      totalUsage: 0,
      successRate: 0,
      averageDuration: 0,
      errorCount: 0,
    };
  }

  clearLogs(_olderThan?: Date): void {
    // 아무것도 하지 않음
  }
}
