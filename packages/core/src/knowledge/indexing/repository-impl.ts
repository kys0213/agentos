import { promises as fs } from 'fs';
import * as path from 'path';
import type { DocumentMapper, IndexSet, Knowledge, KnowledgeId, KnowledgeRepository } from './interfaces';
import { FileDocStore } from './file-doc-store';
import { KnowledgeImpl } from './knowledge-impl';

function asKnowledgeId(id: string): KnowledgeId {
  return id as KnowledgeId;
}

function ensureDir(p: string): Promise<void> {
  return fs.mkdir(p, { recursive: true });
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export class KnowledgeRepositoryImpl implements KnowledgeRepository {
  private readonly rootDir: string;
  private readonly mapper: DocumentMapper;
  private readonly makeIndexSet: (kbDir: string) => IndexSet;

  constructor(params: { rootDir: string; mapper: DocumentMapper; makeIndexSet: (kbDir: string) => IndexSet }) {
    this.rootDir = params.rootDir;
    this.mapper = params.mapper;
    this.makeIndexSet = params.makeIndexSet;
  }

  private kbRoot(): string {
    return path.join(this.rootDir, 'knowledge');
  }

  private kbDir(id: string): string {
    return path.join(this.kbRoot(), id);
  }

  async create(params?: { name?: string; initialIndexes?: string[] }): Promise<Knowledge> {
    const id = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dir = this.kbDir(id);
    await ensureDir(dir);
    await ensureDir(path.join(dir, 'docs'));
    await ensureDir(path.join(dir, 'indexes'));
    const manifest = {
      id,
      name: params?.name ?? id,
      createdAt: new Date().toISOString(),
      indexes: params?.initialIndexes ?? ['bm25'],
    };
    await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    const store = new FileDocStore({ baseDir: dir });
    const indexSet = this.makeIndexSet(dir);
    return new KnowledgeImpl({
      id: asKnowledgeId(id),
      store,
      indexSet,
      mapper: this.mapper,
    });
  }

  async get(id: KnowledgeId): Promise<Knowledge | null> {
    const dir = this.kbDir(String(id));
    if (!(await exists(dir))) return null;
    const store = new FileDocStore({ baseDir: dir });
    const indexSet = this.makeIndexSet(dir);
    return new KnowledgeImpl({
      id,
      store,
      indexSet,
      mapper: this.mapper,
    });
  }

  async list(p?: { cursor?: string; limit?: number }): Promise<{ items: Knowledge[]; nextCursor?: string }> {
    await ensureDir(this.kbRoot());
    const dirs = (await fs.readdir(this.kbRoot(), { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    let start = 0;
    const limit = p?.limit ?? 20;
    if (p?.cursor) {
      const idx = Number(Buffer.from(p.cursor, 'base64').toString('utf-8'));
      if (!Number.isNaN(idx)) start = idx;
    }
    const slice = dirs.slice(start, start + limit);
    const items: Knowledge[] = [];
    for (const id of slice) {
      const kb = await this.get(asKnowledgeId(id));
      if (kb) items.push(kb);
    }
    const nextIndex = start + slice.length;
    const nextCursor = nextIndex < dirs.length ? Buffer.from(String(nextIndex)).toString('base64') : undefined;
    return { items, nextCursor };
  }

  async delete(id: KnowledgeId): Promise<void> {
    const dir = this.kbDir(String(id));
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
