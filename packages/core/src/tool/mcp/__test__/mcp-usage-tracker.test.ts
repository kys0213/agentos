import { InMemoryUsageTracker, NoOpUsageTracker } from '../mcp-usage-tracker';
import { McpUsageLog } from '../mcp-types';

describe('InMemoryUsageTracker', () => {
  let tracker: InMemoryUsageTracker;

  beforeEach(() => {
    tracker = new InMemoryUsageTracker();
  });

  describe('trackUsage', () => {
    it('should track usage with generated id and timestamp', () => {
      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 100,
        status: 'success',
      });

      const logs = tracker.getUsageLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 100,
        status: 'success',
      });
      expect(logs[0].id).toBeDefined();
      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });

    it('should track multiple usage logs', () => {
      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 100,
        status: 'success',
      });

      tracker.trackUsage({
        toolId: 'tool2',
        toolName: 'another-tool',
        action: 'invoke',
        duration: 200,
        status: 'error',
        error: 'Test error',
      });

      const logs = tracker.getUsageLogs();
      expect(logs).toHaveLength(2);
    });
  });

  describe('getUsageLogs', () => {
    beforeEach(() => {
      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 100,
        status: 'success',
      });

      tracker.trackUsage({
        toolId: 'tool2',
        toolName: 'another-tool',
        action: 'invoke',
        duration: 200,
        status: 'error',
      });
    });

    it('should return all logs when no toolId provided', () => {
      const logs = tracker.getUsageLogs();
      expect(logs).toHaveLength(2);
    });

    it('should filter logs by toolId', () => {
      const logs = tracker.getUsageLogs('tool1');
      expect(logs).toHaveLength(1);
      expect(logs[0].toolId).toBe('tool1');
    });

    it('should return empty array for non-existent toolId', () => {
      const logs = tracker.getUsageLogs('non-existent');
      expect(logs).toHaveLength(0);
    });
  });

  describe('getUsageStats', () => {
    beforeEach(() => {
      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 100,
        status: 'success',
      });

      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 200,
        status: 'success',
      });

      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 150,
        status: 'error',
      });
    });

    it('should calculate correct statistics for specific tool', () => {
      const stats = tracker.getUsageStats('tool1');

      expect(stats.totalUsage).toBe(3);
      expect(stats.successRate).toBe(2 / 3);
      expect(stats.averageDuration).toBe(150); // (100 + 200 + 150) / 3
      expect(stats.errorCount).toBe(1);
      expect(stats.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should return zero stats for non-existent tool', () => {
      const stats = tracker.getUsageStats('non-existent');

      expect(stats.totalUsage).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.lastUsedAt).toBeUndefined();
    });

    it('should calculate global statistics when no toolId provided', () => {
      // Add logs for different tools
      tracker.trackUsage({
        toolId: 'tool2',
        toolName: 'another-tool',
        action: 'invoke',
        duration: 300,
        status: 'success',
      });

      const stats = tracker.getUsageStats();
      expect(stats.totalUsage).toBe(4); // 3 from tool1 + 1 from tool2
    });
  });

  describe('clearLogs', () => {
    beforeEach(() => {
      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 100,
        status: 'success',
      });

      tracker.trackUsage({
        toolId: 'tool2',
        toolName: 'another-tool',
        action: 'invoke',
        duration: 200,
        status: 'success',
      });
    });

    it('should clear all logs when no date provided', () => {
      tracker.clearLogs();

      const logs = tracker.getUsageLogs();
      expect(logs).toHaveLength(0);
      expect(tracker.getLogCount()).toBe(0);
    });

    it('should clear logs older than specified date', async () => {
      // The existing logs were added before this cutoff date
      await new Promise((resolve) => setTimeout(resolve, 10));
      const cutoffDate = new Date();

      // Add a log after the cutoff
      await new Promise((resolve) => setTimeout(resolve, 10));

      tracker.trackUsage({
        toolId: 'tool3',
        toolName: 'recent-tool',
        action: 'invoke',
        duration: 50,
        status: 'success',
      });

      // Clear logs older than cutoff, should keep only the recent one
      tracker.clearLogs(cutoffDate);

      const logs = tracker.getUsageLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].toolId).toBe('tool3');
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      // Add logs across different times of a day
      const baseDate = new Date('2024-01-01T10:30:00.000Z');

      tracker.trackUsage({
        toolId: 'tool1',
        toolName: 'test-tool',
        action: 'invoke',
        duration: 100,
        status: 'success',
      });
    });

    it('should return correct log count', () => {
      expect(tracker.getLogCount()).toBe(1);

      tracker.trackUsage({
        toolId: 'tool2',
        toolName: 'another-tool',
        action: 'invoke',
        duration: 200,
        status: 'success',
      });

      expect(tracker.getLogCount()).toBe(2);
    });

    it('should get logs in date range', () => {
      const startDate = new Date(Date.now() - 1000);
      const endDate = new Date(Date.now() + 1000);

      const logs = tracker.getLogsInRange(startDate, endDate);
      expect(logs).toHaveLength(1);
    });

    it('should generate hourly stats', () => {
      const today = new Date();
      const hourlyStats = tracker.getHourlyStats(today);

      expect(hourlyStats.size).toBe(24);
      expect(hourlyStats.get(today.getHours())).toBeGreaterThan(0);
    });
  });

  describe('memory management', () => {
    it('should limit logs to 10,000 entries', () => {
      // Add more than 10,000 logs
      for (let i = 0; i < 10050; i++) {
        tracker.trackUsage({
          toolId: `tool${i}`,
          toolName: 'test-tool',
          action: 'invoke',
          duration: 100,
          status: 'success',
        });
      }

      expect(tracker.getLogCount()).toBe(10000);
    });
  });
});

describe('NoOpUsageTracker', () => {
  let tracker: NoOpUsageTracker;

  beforeEach(() => {
    tracker = new NoOpUsageTracker();
  });

  it('should not track any usage', () => {
    tracker.trackUsage({
      toolId: 'tool1',
      toolName: 'test-tool',
      action: 'invoke',
      duration: 100,
      status: 'success',
    });

    const logs = tracker.getUsageLogs();
    expect(logs).toHaveLength(0);
  });

  it('should return empty stats', () => {
    const stats = tracker.getUsageStats();

    expect(stats.totalUsage).toBe(0);
    expect(stats.successRate).toBe(0);
    expect(stats.averageDuration).toBe(0);
    expect(stats.errorCount).toBe(0);
    expect(stats.lastUsedAt).toBeUndefined();
  });

  it('should do nothing when clearing logs', () => {
    tracker.clearLogs();
    // Should not throw any errors
    expect(true).toBe(true);
  });
});
