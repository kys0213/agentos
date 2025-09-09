import { describe, it, expect, beforeEach } from 'vitest';
import {
  type DocId,
  type IndexRecord,
  type KnowledgeDoc,
  type Query,
  type SearchHit,
  type SearchIndex,
  type IndexStats,
  type DocumentMapper,
} from '../interfaces';
import { DefaultIndexSet } from '../index-set';

function asDocId(id: string): DocId {
  return id as DocId;
}

function makeDoc(id: string, title: string, text: string): KnowledgeDoc {
  const now = new Date().toISOString();
  return {
    id: asDocId(id),
    title,
    tags: [],
    source: { kind: 'text', text },
    createdAt: now,
    updatedAt: now,
    status: 'ready',
  };
}

class StubIndex implements SearchIndex {
  public readonly name: string;
  public upserts: IndexRecord[][] = [];
  public removes: DocId[] = [];
  private fixedResults: SearchHit[] | null = null;

  constructor(name: string) {
    this.name = name;
  }

  setResults(hits: SearchHit[]) {
    this.fixedResults = hits;
  }

  async upsert(records: AsyncIterable<IndexRecord>): Promise<void> {
    const batch: IndexRecord[] = [];
    for await (const r of records) {
      batch.push(r);
    }
    this.upserts.push(batch);
  }

  async remove(id: DocId): Promise<void> { this.removes.push(id); }
  async removeMany(ids: DocId[] | Iterable<DocId>): Promise<void> { for (const id of ids) this.removes.push(id); }
  async removeByGenerator(ids: AsyncIterable<DocId>): Promise<void> { for await (const id of ids) this.removes.push(id); }
  async removeAll(): Promise<void> { this.removes = []; }

  async search(_query: Query): Promise<SearchHit[]> {
    return this.fixedResults ? [...this.fixedResults] : [];
  }

  async reindex(allRecords: AsyncIterable<IndexRecord>): Promise<void> {
    // Treat as a single upsert call for simplicity
    await this.upsert(allRecords);
  }

  async stats(): Promise<IndexStats> {
    return { docCount: this.upserts.flat().length, lastBuiltAt: undefined };
  }
}

const mapper: DocumentMapper = {
  async *toRecords(doc: KnowledgeDoc) {
    const text = doc.source.kind === 'text' ? doc.source.text : '';
    yield { id: doc.id, fields: { title: doc.title, text } } satisfies IndexRecord;
  },
};

describe('DefaultIndexSet', () => {
  let bm25: StubIndex;
  let vector: StubIndex;
  let set: DefaultIndexSet;

  beforeEach(() => {
    bm25 = new StubIndex('bm25');
    vector = new StubIndex('vector:custom');
    set = new DefaultIndexSet([bm25, vector]);
  });

  it('lists and gets indexes by name', () => {
    const names = set.list().map((i) => i.name);
    expect(names).toEqual(['bm25', 'vector:custom']);
    expect(set.get('bm25')?.name).toBe('bm25');
    expect(set.get('nope')).toBeUndefined();
  });

  it('search returns single index results directly', async () => {
    bm25.setResults([
      { docId: asDocId('d1'), score: 1, indexName: 'bm25' },
      { docId: asDocId('d2'), score: 0.5, indexName: 'bm25' },
    ]);
    const hits = await set.search({ text: 'q', topK: 5 }, { indexes: ['bm25'] });
    expect(hits.map((h) => h.docId)).toEqual([asDocId('d1'), asDocId('d2')]);
  });

  it('merges results with default RRF when multiple indexes selected', async () => {
    bm25.setResults([
      { docId: asDocId('d1'), score: 10, indexName: 'bm25' },
      { docId: asDocId('d3'), score: 9, indexName: 'bm25' },
    ]);
    vector.setResults([
      { docId: asDocId('d2'), score: 0.9, indexName: 'vector:custom' },
      { docId: asDocId('d1'), score: 0.8, indexName: 'vector:custom' },
    ]);
    const hits = await set.search({ text: 'q', topK: 3 }, { indexes: ['bm25', 'vector:custom'] });
    // RRF should surface d1 (present in both), then d2 or d3 depending on ranks
    expect(hits[0].docId).toEqual(asDocId('d1'));
    const remaining = hits.slice(1).map((h) => String(h.docId));
    expect(remaining.sort()).toEqual(['d2', 'd3']);
  });

  it('reindex streams records via mapper to targeted indexes', async () => {
    const docs = (async function* () {
      yield makeDoc('a', 'A', 'alpha');
      yield makeDoc('b', 'B', 'beta');
    })();

    await set.reindex(mapper, docs, ['bm25']);
    // bm25 should receive two records, vector none
    expect(bm25.upserts.flat().map((r) => String(r.id))).toEqual(['a', 'b']);
    expect(vector.upserts.length).toBe(0);
  });
});
