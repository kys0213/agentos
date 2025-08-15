import type { LlmUsage } from 'llm-bridge-spec/dist/esm/bridge/types';

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

export class InMemoryLlmUsageTracker implements LlmBridgeUsageTracker {
  private logs: LlmBridgeUsageLog[] = [];
  private nextId = 1;

  trackUsage(log: Omit<LlmBridgeUsageLog, 'id' | 'timestamp'>): void {
    const entry: LlmBridgeUsageLog = {
      id: `llm_log_${this.nextId++}_${Date.now()}`,
      timestamp: new Date(),
      ...log,
    };
    this.logs.push(entry);
    if (this.logs.length > 10000) this.logs = this.logs.slice(-10000);
  }

  getUsageLogs(bridgeId?: string): LlmBridgeUsageLog[] {
    if (!bridgeId) return [...this.logs];
    return this.logs.filter((l) => l.bridgeId === bridgeId);
  }

  getUsageStats(bridgeId?: string): LlmBridgeUsageStats {
    const logs = this.getUsageLogs(bridgeId);
    if (logs.length === 0) {
      return {
        totalRequests: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        averageTokensPerRequest: 0,
        errorCount: 0,
      };
    }
    const promptTokens = logs.reduce((s, l) => s + (l.usage?.promptTokens ?? 0), 0);
    const completionTokens = logs.reduce((s, l) => s + (l.usage?.completionTokens ?? 0), 0);
    const totalTokens = logs.reduce((s, l) => s + (l.usage?.totalTokens ?? 0), 0);
    const errorCount = logs.filter((l) => l.status === 'error').length;
    const lastUsedAt = new Date(Math.max(...logs.map((l) => l.timestamp.getTime())));
    return {
      totalRequests: logs.length,
      promptTokens,
      completionTokens,
      totalTokens,
      averageTokensPerRequest: totalTokens / logs.length,
      lastUsedAt,
      errorCount,
    };
  }

  clearLogs(olderThan?: Date): void {
    if (!olderThan) {
      this.logs.length = 0;
      this.nextId = 1;
      return;
    }
    this.logs = this.logs.filter((l) => l.timestamp >= olderThan);
  }
}

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
