import { describe, it, expect } from 'vitest';
import { KnowledgeImpl } from '../knowledge-impl';
import type { DocStore, KnowledgeDoc, DocumentMapper, IndexSet, SearchHit, Query, IndexStats, SearchIndex } from '../interfaces';

class MockStore implements DocStore {
  public limits: number[] = [];
  private total: number;
  constructor(total: number) {
    this.total = total;
  }
  async create(input: Omit<KnowledgeDoc, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<KnowledgeDoc> {
    const now = new Date().toISOString();
    return { id: `${Math.random()}`, title: input.title, source: input.source, tags: input.tags, createdAt: now, updatedAt: now, status: 'ready' };
  }
  async get(): Promise<KnowledgeDoc | null> { return null; }
  async delete(): Promise<void> { /* noop */ }
  async list(cursor?: string, limit: number = 50): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }> {
    this.limits.push(limit);
    let start = 0;
    if (cursor) {
      start = Number(Buffer.from(cursor, 'base64').toString('utf-8')) || 0;
    }
    const end = Math.min(this.total, start + limit);
    const items: KnowledgeDoc[] = [];
    for (let i = start; i < end; i++) {
      items.push({ id: String(i), title: `D${i}`, source: { kind: 'text', text: '' }, createdAt: '', updatedAt: '', status: 'ready' });
    }
    const nextCursor = end < this.total ? Buffer.from(String(end)).toString('base64') : undefined;
    return { items, nextCursor };
  }
}

const mapper: DocumentMapper = {
  async *toRecords() { /* not used here */ }
};

const emptyIndexSet: IndexSet = {
  list(): SearchIndex[] { return []; },
  get(): SearchIndex | undefined { return undefined; },
  async search(_q: Query): Promise<SearchHit[]> { return []; },
  async reindex(): Promise<void> { /* noop */ },
};

describe('KnowledgeImpl allDocs chunkSize cap', () => {
  it('caps chunkSize to 100 when larger is requested', async () => {
    const store = new MockStore(250);
    const kb = new KnowledgeImpl({ id: 'kb1', store, indexSet: emptyIndexSet, mapper });
    let batches = 0;
    for await (const _batch of kb.allDocs({ chunkSize: 1000 })) {
      batches++;
    }
    expect(batches).toBeGreaterThan(0);
    expect(Math.max(...store.limits)).toBeLessThanOrEqual(100);
  });
});

