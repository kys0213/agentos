import type { LlmUsage } from 'llm-bridge-spec';

export type LlmUsageStatus = 'success' | 'error';

export interface LlmBridgeUsageLog {
  id: string;
  bridgeId: string;
  timestamp: Date;
  usage: LlmUsage;
  durationMs?: number;
  status: LlmUsageStatus;
}

export interface LlmBridgeUsageStats {
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  averageTokensPerRequest: number;
  lastUsedAt?: Date;
  errorCount: number;
}

export interface LlmBridgeUsageTracker {
  trackUsage(log: Omit<LlmBridgeUsageLog, 'id' | 'timestamp'>): void;
  getUsageLogs(bridgeId?: string): LlmBridgeUsageLog[];
  getUsageStats(bridgeId?: string): LlmBridgeUsageStats;
  clearLogs(olderThan?: Date): void;
}
