import type { CursorPagination } from '../../../../common/pagination/cursor-pagination';
import type { McpUsageLog, McpUsageQuery } from '../types';
import type { McpUsageRepository } from '../repository/mcp-usage-repository';

type StartMeta = {
  toolId?: string;
  toolName?: string;
  agentId?: string;
  sessionId?: string;
};

export class McpUsageService {
  private readonly inflight = new Map<string, StartMeta>();

  constructor(private readonly repo: McpUsageRepository) {}

  /**
   * Records the start of an operation and returns a correlation id.
   * The actual usage entry is stored on recordEnd.
   */
  async recordStart(meta: StartMeta): Promise<string> {
    const id = this.makeId();
    this.inflight.set(id, { ...meta });
    return id;
  }

  /**
   * Finalizes an operation and persists the usage entry.
   */
  async recordEnd(
    id: string,
    result: { status: 'success' | 'error'; durationMs: number; errorCode?: string }
  ): Promise<void> {
    const meta = this.inflight.get(id) ?? {};
    const log: McpUsageLog = {
      id,
      toolId: meta.toolId,
      toolName: meta.toolName,
      agentId: meta.agentId,
      sessionId: meta.sessionId,
      timestamp: new Date(),
      operation: 'tool.call',
      status: result.status,
      durationMs: result.durationMs,
      errorCode: result.errorCode,
    };
    await this.repo.append(log);
    this.inflight.delete(id);
  }

  async list(query?: McpUsageQuery, pg?: CursorPagination) {
    return this.repo.list(query, pg);
  }

  async getStats(query?: McpUsageQuery) {
    return this.repo.getStats(query);
  }

  // ---------- helpers ----------
  private makeId(): string {
    // Simple, collision-resistant enough for local usage logs
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
