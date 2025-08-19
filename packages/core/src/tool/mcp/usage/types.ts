export type McpUsageStatus = 'success' | 'error';

export interface McpUsageLog {
  id: string;
  toolId?: string;
  toolName?: string;
  timestamp: Date;
  operation: 'tool.call';
  status: McpUsageStatus;
  durationMs?: number;
  agentId?: string;
  sessionId?: string;
  errorCode?: string;
}

export interface McpUsageStats {
  totalUsage: number;
  successRate: number;
  averageDuration: number;
  lastUsedAt?: Date;
  errorCount: number;
}

export interface McpUsageQuery {
  toolId?: string;
  toolName?: string;
  agentId?: string;
  sessionId?: string;
  status?: McpUsageStatus;
  from?: Date;
  to?: Date;
}
