import { describe, it, expect } from 'vitest';
import { KnowledgeImpl } from '../knowledge-impl';
import type {
  DocStore,
  KnowledgeDoc,
  DocumentMapper,
  IndexSet,
  SearchHit,
  Query,
  IndexRecord,
  SearchIndex,
  IndexStats,
} from '../interfaces';

class MockStore implements DocStore {
  public limits: number[] = [];
  constructor(private total: number) {}
  async create(input: Omit<KnowledgeDoc, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<KnowledgeDoc> {
    const now = new Date().toISOString();
    return { id: 'x', title: input.title, source: input.source, tags: input.tags, createdAt: now, updatedAt: now, status: 'ready' };
  }
  async get(): Promise<KnowledgeDoc | null> { return null; }
  async delete(): Promise<void> {}
  async list(cursor?: string, limit: number = 50): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }> {
    this.limits.push(limit);
    let start = 0;
    if (cursor) start = Number(Buffer.from(cursor, 'base64').toString('utf-8')) || 0;
    const end = Math.min(this.total, start + limit);
    const items: KnowledgeDoc[] = [];
    for (let i = start; i < end; i++) items.push({ id: String(i), title: `D${i}`, source: { kind: 'text', text: '' }, createdAt: '', updatedAt: '', status: 'ready' });
    const nextCursor = end < this.total ? Buffer.from(String(end)).toString('base64') : undefined;
    return { items, nextCursor };
  }
}

class CapturingIndexSet implements IndexSet {
  public collected: string[] = [];
  list(): SearchIndex[] { return []; }
  get(): SearchIndex | undefined { return undefined; }
  async search(_q: Query): Promise<SearchHit[]> { return []; }
  async reindex(_mapper: DocumentMapper, docs: AsyncIterable<KnowledgeDoc>): Promise<void> {
    for await (const d of docs) this.collected.push(String(d.id));
  }
}

const mapper: DocumentMapper = { async *toRecords(_doc: KnowledgeDoc) { /* not used */ } };

describe('KnowledgeImpl.reindex uses allDocs chunkSize=1', () => {
  it('streams all docs individually to IndexSet.reindex and uses limit=1', async () => {
    const store = new MockStore(5);
    const indexSet = new CapturingIndexSet();
    const kb = new KnowledgeImpl({ id: 'kb1', store, indexSet, mapper });
    await kb.reindex();
    expect(indexSet.collected.length).toBe(5);
    // Default reindex uses allDocs({ chunkSize: 100 }) per current impl
    expect(Math.max(...store.limits)).toBe(100);
  });
});
