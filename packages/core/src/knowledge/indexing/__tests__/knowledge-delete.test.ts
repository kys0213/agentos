import { describe, it, expect } from 'vitest';
import { KnowledgeImpl } from '../knowledge-impl';
import { DefaultIndexSet } from '../index-set';
import type {
  DocStore,
  KnowledgeDoc,
  DocumentMapper,
  SearchIndex,
  Query,
  SearchHit,
  IndexRecord,
  IndexStats,
} from '../interfaces';

class MockStore implements DocStore {
  lastCreated?: KnowledgeDoc;
  deleted: string[] = [];
  async create(input: Omit<KnowledgeDoc, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<KnowledgeDoc> {
    const now = new Date().toISOString();
    const doc: KnowledgeDoc = {
      id: 'doc-1',
      title: input.title,
      tags: input.tags,
      source: input.source,
      createdAt: now,
      updatedAt: now,
      status: 'ready',
    };
    this.lastCreated = doc;
    return doc;
  }
  async get(): Promise<KnowledgeDoc | null> { return null; }
  async list(): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }> { return { items: [] }; }
  async delete(id: string): Promise<void> { this.deleted.push(id); }
}

class StubIndex implements SearchIndex {
  public readonly name: string;
  public upserts: IndexRecord[][] = [];
  public removed: string[] = [];
  constructor(name: string) { this.name = name; }
  async upsert(records: AsyncIterable<IndexRecord>): Promise<void> {
    const batch: IndexRecord[] = [];
    for await (const r of records) batch.push(r);
    this.upserts.push(batch);
  }
  async remove(id: string): Promise<void> { this.removed.push(id); }
  async removeMany(ids: string[] | Iterable<string>): Promise<void> { for (const id of ids) this.removed.push(id); }
  async removeByGenerator(ids: AsyncIterable<string>): Promise<void> { for await (const id of ids) this.removed.push(id); }
  async removeAll(): Promise<void> { this.removed = []; }
  async search(_q: Query): Promise<SearchHit[]> { return []; }
  async reindex(_all: AsyncIterable<IndexRecord>): Promise<void> {}
  async stats(): Promise<IndexStats> { return { docCount: this.upserts.flat().length, lastBuiltAt: undefined }; }
}

const mapper: DocumentMapper = {
  async *toRecords(doc: KnowledgeDoc) {
    const text = doc.source.kind === 'text' ? doc.source.text : '';
    yield { id: doc.id, fields: { title: doc.title, text } } satisfies IndexRecord;
  },
};

describe('KnowledgeImpl.deleteDoc propagates to indexes', () => {
  it('calls remove(id) on all indexes', async () => {
    const store = new MockStore();
    const i1 = new StubIndex('i1');
    const i2 = new StubIndex('i2');
    const indexSet = new DefaultIndexSet([i1, i2]);
    const kb = new KnowledgeImpl({ id: 'kb-x', store, indexSet, mapper });

    const doc = await kb.addDoc({ title: 'T', source: { kind: 'text', text: 'hello' } });
    await kb.deleteDoc(doc.id);

    expect(i1.removed).toContain(doc.id);
    expect(i2.removed).toContain(doc.id);
  });
});

