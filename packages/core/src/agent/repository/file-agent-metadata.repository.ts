import path from 'path';
import { fs as langFs } from '@agentos/lang';
import type { AgentStatus } from '../agent';
import type { AgentMetadata, CreateAgentMetadata, ReadonlyAgentMetadata } from '../agent-metadata';
import type { AgentMetadataRepository } from '../agent-metadata.repository';
import type { AgentSearchQuery } from '../agent-search';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../common/pagination/cursor-pagination';
import { paginateByCursor } from '../../common/pagination/paginate';
import { Errors } from '../../common/error/core-error';
import { SimpleEventEmitter } from '../../common/event/simple-event-emitter';
import type { Unsubscribe } from '../../common/event/event-subscriber';

type RepoEvents = {
  changed: { id: string; version?: string };
  deleted: { id: string; version?: string };
};

/**
 * File-based AgentMetadataRepository implementation.
 * Stores each agent metadata as a JSON file under the provided root directory.
 *
 * File name: <root>/<id>.json
 */
export class FileAgentMetadataRepository implements AgentMetadataRepository {
  private readonly events = new SimpleEventEmitter<RepoEvents>();

  constructor(private readonly rootDir: string) {}

  async get(id: string): Promise<AgentMetadata | null> {
    const p = this.filePath(id);
    const exists = await langFs.FileUtils.exists(p);
    if (!exists) {
      return null;
    }
    const handler = langFs.JsonFileHandler.create<AgentMetadata>(p);
    return await handler.readOrThrow({ reviveDates: true });
  }

  async list(pagination?: CursorPagination): Promise<CursorPaginationResult<AgentMetadata>> {
    const all = await this.readAll();
    return paginateByCursor(all, pagination);
  }

  async search(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentMetadata>> {
    const all = await this.readAll();
    const filtered = all.filter((m) => this.matches(m, query));
    return paginateByCursor(filtered, pagination);
  }

  async create(meta: CreateAgentMetadata): Promise<AgentMetadata> {
    await this.ensureDir();
    const id = this.createId();
    const record: AgentMetadata = {
      id,
      version: '1',
      name: meta.name,
      description: meta.description,
      icon: meta.icon,
      keywords: meta.keywords,
      preset: meta.preset,
      status: meta.status as Readonly<AgentStatus>,
      sessionCount: 0,
      usageCount: 0,
      lastUsed: undefined,
    } as AgentMetadata;

    const handler = langFs.JsonFileHandler.create<AgentMetadata>(this.filePath(id));
    await handler.writeOrThrow(record, { prettyPrint: true });
    this.events.emit('changed', { id: record.id, version: record.version });
    return record;
  }

  async update(
    id: string,
    patch: Partial<AgentMetadata>,
    options?: { etag?: string; expectedVersion?: string }
  ): Promise<AgentMetadata> {
    await this.ensureDir();
    const current = await this.getOrThrow(id);
    if (
      options?.expectedVersion &&
      current.version &&
      current.version !== options.expectedVersion
    ) {
      throw Errors.versionConflict('agent_metadata_repository', 'Version conflict', {
        expectedVersion: options.expectedVersion,
        currentVersion: current.version,
        id,
      });
    }

    const next: AgentMetadata = {
      ...current,
      ...patch,
      version: this.nextVersion(current.version),
    } as AgentMetadata;

    const handler = langFs.JsonFileHandler.create<AgentMetadata>(this.filePath(id));
    await handler.writeOrThrow(next, { prettyPrint: true });
    this.events.emit('changed', { id: next.id, version: next.version });
    return next;
  }

  async delete(id: string): Promise<void> {
    const res = await langFs.FileUtils.remove(this.filePath(id));
    if (!res.success) {
      const reason = res.reason;
      const msg =
        typeof reason === 'object' && reason && 'message' in reason
          ? String((reason as { message?: unknown }).message)
          : String(reason ?? 'unknown');
      if (msg.includes('ENOENT')) {
        return;
      }
      throw Errors.internal('agent_metadata_repository', 'Failed to delete metadata file', {
        id,
        cause: msg,
      });
    }
    this.events.emit('deleted', { id });
  }

  async addActiveSessionCount(id: string): Promise<void> {
    const current = await this.getOrThrow(id);
    const next: AgentMetadata = {
      ...current,
      sessionCount: (current.sessionCount ?? 0) + 1,
      version: this.nextVersion(current.version),
    } as AgentMetadata;
    const handler = langFs.JsonFileHandler.create<AgentMetadata>(this.filePath(id));
    await handler.writeOrThrow(next, { prettyPrint: true });
    this.events.emit('changed', { id: next.id, version: next.version });
  }

  async minusActiveSessionCount(id: string): Promise<void> {
    const current = await this.getOrThrow(id);
    const nextCount = Math.max(0, (current.sessionCount ?? 0) - 1);
    const next: AgentMetadata = {
      ...current,
      sessionCount: nextCount,
      version: this.nextVersion(current.version),
    } as AgentMetadata;
    const handler = langFs.JsonFileHandler.create<AgentMetadata>(this.filePath(id));
    await handler.writeOrThrow(next, { prettyPrint: true });
    this.events.emit('changed', { id: next.id, version: next.version });
  }

  on?(
    event: 'changed' | 'deleted',
    handler: (p: { id: string; version?: string }) => void
  ): Unsubscribe {
    return this.events.on(event, handler);
  }

  // helpers
  private filePath(id: string): string {
    return path.join(this.rootDir, `${id}.json`);
  }

  private async ensureDir() {
    await langFs.FileUtils.ensureDir(this.rootDir);
  }

  private async readAll(): Promise<AgentMetadata[]> {
    await this.ensureDir();
    const dirRes = await langFs.FileUtils.readDir(this.rootDir);
    if (!dirRes.success) {
      return [];
    }
    const files = dirRes.result.filter((name) => name.endsWith('.json'));
    const items: AgentMetadata[] = [];
    for (const name of files) {
      try {
        const handler = langFs.JsonFileHandler.create<AgentMetadata>(path.join(this.rootDir, name));
        const data = await handler.readOrThrow({ reviveDates: true });
        items.push(data);
      } catch {
        // skip malformed file
      }
    }
    return items;
  }

  // pagination handled by paginateByCursor

  private matches(meta: ReadonlyAgentMetadata, q: AgentSearchQuery): boolean {
    if (q.status && meta.status !== q.status) {
      return false;
    }
    if (q.name && !meta.name.toLowerCase().includes(q.name.toLowerCase())) {
      return false;
    }
    if (q.description && !meta.description.toLowerCase().includes(q.description.toLowerCase())) {
      return false;
    }
    if (Array.isArray(q.keywords) && q.keywords.length > 0) {
      const kw = new Set(q.keywords.map((k) => k.toLowerCase()));
      const has = meta.keywords.some((k) => kw.has(k.toLowerCase()));
      if (!has) {
        return false;
      }
    }
    return true;
  }

  private createId(): string {
    return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private nextVersion(current?: string): string {
    const n = current ? Number(current) : 0;
    if (Number.isFinite(n)) {
      return String(n + 1);
    }
    return Date.now().toString(36);
  }

  async getOrThrow(id: string): Promise<AgentMetadata> {
    const m = await this.get(id);
    if (!m) {
      throw Errors.notFound('agent_metadata_repository', `Agent metadata not found: ${id}`, { id });
    }
    return m;
  }

  // events emitted via SimpleEventEmitter
}
