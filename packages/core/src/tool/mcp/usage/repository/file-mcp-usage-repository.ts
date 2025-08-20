import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../../../common/pagination/cursor-pagination';
import { paginateByCursor } from '../../../../common/pagination/paginate';
import type { McpUsageLog, McpUsageQuery, McpUsageStats } from '../types';
import type { McpUsageRepository } from './mcp-usage-repository';

/**
 * File-based implementation for MCP usage repository.
 * Stores logs in a single JSON file (array). Suitable for tests and local dev.
 */
export class FileMcpUsageRepository implements McpUsageRepository {
  private initialized = false;

  constructor(private readonly storagePath: string) {}

  async append(logs: McpUsageLog | McpUsageLog[]): Promise<void> {
    await this.ensureInitialized();
    const all = await this.loadAll();
    const arr = Array.isArray(logs) ? logs : [logs];
    // Serialize Date fields
    const normalized = arr.map((l) => ({ ...l, timestamp: new Date(l.timestamp) }));
    all.push(...normalized);
    await this.saveAll(all);
  }

  async list(
    query?: McpUsageQuery,
    pg?: CursorPagination
  ): Promise<CursorPaginationResult<McpUsageLog>> {
    await this.ensureInitialized();
    const all = await this.loadAll();
    const filtered = this.filter(all, query);
    return paginateByCursor(filtered, pg);
  }

  async getStats(query?: McpUsageQuery): Promise<McpUsageStats> {
    await this.ensureInitialized();
    const all = await this.loadAll();
    const filtered = this.filter(all, query);
    const totalUsage = filtered.length;
    const errorCount = filtered.filter((l) => l.status === 'error').length;
    const durations = filtered.map((l) => l.durationMs ?? 0).filter((d) => d > 0);
    const averageDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const last = filtered.reduce<number | undefined>((acc, l) => {
      const t =
        l.timestamp instanceof Date ? l.timestamp.getTime() : new Date(l.timestamp).getTime();
      return acc === undefined || t > acc ? t : acc;
    }, undefined);
    const successRate = totalUsage > 0 ? (totalUsage - errorCount) / totalUsage : 0;
    return {
      totalUsage,
      successRate,
      averageDuration,
      lastUsedAt: last !== undefined ? new Date(last) : undefined,
      errorCount,
    };
  }

  // ---------- helpers ----------
  private filter(items: McpUsageLog[], q?: McpUsageQuery): McpUsageLog[] {
    if (!q) return items;
    return items.filter((l) => {
      if (q.toolId && l.toolId !== q.toolId) return false;
      if (q.toolName && l.toolName !== q.toolName) return false;
      if (q.agentId && l.agentId !== q.agentId) return false;
      if (q.sessionId && l.sessionId !== q.sessionId) return false;
      if (q.status && l.status !== q.status) return false;
      if (q.from && new Date(l.timestamp).getTime() < q.from.getTime()) return false;
      if (q.to && new Date(l.timestamp).getTime() > q.to.getTime()) return false;
      return true;
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
    try {
      await fs.access(this.storagePath);
    } catch {
      await this.saveAll([]);
    }
    this.initialized = true;
  }

  private async loadAll(): Promise<McpUsageLog[]> {
    try {
      const content = await fs.readFile(this.storagePath, 'utf-8');
      const arr = JSON.parse(content) as Array<unknown>;
      return arr.map((x) => {
        const l = x as McpUsageLog;
        return { ...l, timestamp: new Date(l.timestamp) } as McpUsageLog;
      });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw e;
    }
  }

  private async saveAll(items: McpUsageLog[]): Promise<void> {
    const serializable = items.map((l) => ({ ...l, timestamp: new Date(l.timestamp) }));
    await fs.writeFile(this.storagePath, JSON.stringify(serializable, null, 2), 'utf-8');
  }
}
