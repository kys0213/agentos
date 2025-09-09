import { promises as fs } from 'fs';
import * as path from 'path';
import type { DocStore, KnowledgeDoc, DocId } from './interfaces';

function ensureDir(p: string): Promise<void> {
  return fs.mkdir(p, { recursive: true }).then(() => undefined);
}

function toDocId(id: string): DocId {
  return id as DocId;
}

function safeJoin(root: string, ...parts: string[]): string {
  const joined = path.join(root, ...parts);
  const rel = path.relative(root, joined);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path traversal detected');
  }
  return joined;
}

export class FileDocStore implements DocStore {
  private readonly baseDir: string;

  constructor(params: { baseDir: string }) {
    this.baseDir = params.baseDir;
  }

  private docsDir(): string {
    return path.join(this.baseDir, 'docs');
  }

  private docPath(id: string): string {
    return safeJoin(this.docsDir(), `${id}.json`);
  }

  async create(
    input: Omit<KnowledgeDoc, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<KnowledgeDoc> {
    const now = new Date().toISOString();
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const doc: KnowledgeDoc = {
      id: toDocId(id),
      title: input.title,
      tags: input.tags ?? [],
      source: input.source,
      createdAt: now,
      updatedAt: now,
      status: 'ready',
    };

    await ensureDir(this.docsDir());
    await fs.writeFile(this.docPath(id), JSON.stringify(doc, null, 2), 'utf-8');
    return doc;
  }

  async get(id: DocId): Promise<KnowledgeDoc | null> {
    try {
      const p = this.docPath(String(id));
      const data = await fs.readFile(p, 'utf-8');
      return JSON.parse(data) as KnowledgeDoc;
    } catch (e: unknown) {
      return null;
    }
  }

  async list(
    cursor?: string,
    limit: number = 50
  ): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }> {
    await ensureDir(this.docsDir());
    const files = (await fs.readdir(this.docsDir())).filter((f) => f.endsWith('.json')).sort();

    let start = 0;
    if (cursor) {
      const idx = Number(Buffer.from(cursor, 'base64').toString('utf-8'));
      if (!Number.isNaN(idx)) {
        start = idx;
      }
    }

    const slice = files.slice(start, start + limit);
    const items: KnowledgeDoc[] = [];
    for (const f of slice) {
      const data = await fs.readFile(path.join(this.docsDir(), f), 'utf-8');
      items.push(JSON.parse(data) as KnowledgeDoc);
    }
    const nextIndex = start + slice.length;
    const nextCursor =
      nextIndex < files.length ? Buffer.from(String(nextIndex)).toString('base64') : undefined;
    return { items, nextCursor };
  }

  async delete(id: DocId): Promise<void> {
    try {
      await fs.unlink(this.docPath(String(id)));
    } catch (e: unknown) {
      // ignore
    }
  }
}
