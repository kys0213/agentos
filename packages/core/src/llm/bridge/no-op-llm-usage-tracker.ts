import { LlmBridgeUsageTracker, LlmBridgeUsageLog, LlmBridgeUsageStats } from './usage';

export class NoOpLlmUsageTracker implements LlmBridgeUsageTracker {
  trackUsage(_log: Omit<LlmBridgeUsageLog, 'id' | 'timestamp'>): void {}
  getUsageLogs(_bridgeId?: string): LlmBridgeUsageLog[] {
    return [];
  }
  getUsageStats(_bridgeId?: string): LlmBridgeUsageStats {
    return {
      totalRequests: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      averageTokensPerRequest: 0,
      errorCount: 0,
    };
  }
  clearLogs(_olderThan?: Date): void {}
}
