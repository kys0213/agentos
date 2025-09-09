import { isNonEmptyArray } from '@agentos/lang/validation';
import { McpUsageTracker, McpUsageLog, McpUsageStats } from './mcp-types';

/**
 * 메모리 기반 MCP 사용량 추적기 구현
 *
 * 사용량 로그를 메모리에 저장하고 실시간 통계를 제공합니다.
 * 프로덕션 환경에서는 데이터베이스 기반 구현으로 교체할 수 있습니다.
 */

export class InMemoryUsageTracker implements McpUsageTracker {
  private logs: McpUsageLog[] = [];
  private nextId = 1;

  /**
   * 사용량 로그 기록
   */
  trackUsage(log: Omit<McpUsageLog, 'id' | 'timestamp'>): void {
    const newLog: McpUsageLog = {
      id: this.generateId(),
      timestamp: new Date(),
      ...log,
    };

    this.logs.push(newLog);

    // 메모리 사용량 제한 (최대 10,000개 로그 유지)
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }
  }

  /**
   * 사용량 로그 조회
   */
  getUsageLogs(toolId?: string): McpUsageLog[] {
    if (!toolId) {
      return [...this.logs];
    }

    return this.logs.filter((log) => log.toolId === toolId);
  }

  /**
   * 사용량 통계 조회
   */
  getUsageStats(toolId?: string): McpUsageStats {
    const targetLogs = this.getUsageLogs(toolId);

    if (!isNonEmptyArray(targetLogs)) {
      return {
        totalUsage: 0,
        successRate: 0,
        averageDuration: 0,
        errorCount: 0,
      };
    }

    const successCount = targetLogs.filter((log) => log.status === 'success').length;
    const errorCount = targetLogs.filter((log) => log.status === 'error').length;
    const totalDuration = targetLogs.reduce((sum, log) => sum + log.duration, 0);
    const lastUsedAt = isNonEmptyArray(targetLogs)
      ? new Date(Math.max(...targetLogs.map((log) => log.timestamp.getTime())))
      : undefined;

    return {
      totalUsage: targetLogs.length,
      successRate: isNonEmptyArray(targetLogs) ? successCount / targetLogs.length : 0,
      averageDuration: isNonEmptyArray(targetLogs) ? totalDuration / targetLogs.length : 0,
      lastUsedAt,
      errorCount,
    };
  }

  /**
   * 오래된 로그 삭제
   */
  clearLogs(olderThan?: Date): void {
    if (!olderThan) {
      // 모든 로그 삭제
      this.logs.length = 0;
      this.nextId = 1;
      return;
    }

    // 지정된 날짜 이전의 로그 삭제
    this.logs = this.logs.filter((log) => log.timestamp >= olderThan);
  }

  /**
   * 현재 저장된 로그 개수 반환 (디버깅/모니터링 용도)
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * 특정 기간 내 로그 조회 (추가 유틸리티 메서드)
   */
  getLogsInRange(startDate: Date, endDate: Date, toolId?: string): McpUsageLog[] {
    const targetLogs = this.getUsageLogs(toolId);

    return targetLogs.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate);
  }

  /**
   * 시간별 사용량 통계 (추가 유틸리티 메서드)
   */
  getHourlyStats(date: Date, toolId?: string): Map<number, number> {
    const targetLogs = this.getUsageLogs(toolId);
    const hourlyStats = new Map<number, number>();

    // 0-23시간 초기화
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats.set(hour, 0);
    }

    targetLogs
      .filter((log) => {
        const logDate = log.timestamp;
        return (
          logDate.getFullYear() === date.getFullYear() &&
          logDate.getMonth() === date.getMonth() &&
          logDate.getDate() === date.getDate()
        );
      })
      .forEach((log) => {
        const hour = log.timestamp.getHours();
        hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
      });

    return hourlyStats;
  }

  private generateId(): string {
    return `log_${this.nextId++}_${Date.now()}`;
  }
}
