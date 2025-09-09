import type {
  DocId,
  DocumentMapper,
  IndexSet,
  IndexStats,
  Knowledge,
  KnowledgeDoc,
  KnowledgeId,
  MergePolicy,
  Query,
  DocStore,
  SearchHit,
} from './interfaces';

export class KnowledgeImpl implements Knowledge {
  public readonly id: KnowledgeId;
  private readonly store: DocStore;
  private readonly indexSet: IndexSet;
  private readonly mapper: DocumentMapper;

  constructor(params: {
    id: KnowledgeId;
    store: DocStore;
    indexSet: IndexSet;
    mapper: DocumentMapper;
  }) {
    this.id = params.id;
    this.store = params.store;
    this.indexSet = params.indexSet;
    this.mapper = params.mapper;
  }

  async addDoc(input: {
    title: string;
    source: KnowledgeDoc['source'];
    tags?: string[];
  }): Promise<KnowledgeDoc> {
    const doc = await this.store.create(input);
    // synchronous upsert MVP (can be queued later)
    const records = this.mapper.toRecords(doc);
    await Promise.all(this.indexSet.list().map((idx) => idx.upsert(records)));
    return doc;
  }

  async deleteDoc(id: DocId): Promise<void> {
    await this.store.delete(id);

    await Promise.all(this.indexSet.list().map((idx) => idx.remove(id)));
  }

  async listDocs(p?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }> {
    const page = await this.store.list(p?.cursor, p?.limit);

    return { items: page.items, nextCursor: page.nextCursor };
  }

  async *allDocs(p?: { chunkSize?: number }): AsyncIterable<KnowledgeDoc[]> {
    let cursor: string | undefined = undefined;
    // Enforce chunk size bounds: 1..100 (cap at 100)
    const requested = p?.chunkSize ?? 100;

    const chunk = Math.min(100, Math.max(1, requested));
    do {
      const page = await this.store.list(cursor, chunk);
      if (page.items.length > 0) {
        yield page.items;
      }
      cursor = page.nextCursor;
    } while (cursor);
  }

  async query(q: Query, opts?: { indexes?: string[]; merge?: MergePolicy }): Promise<SearchHit[]> {
    return this.indexSet.search(q, opts);
  }

  async reindex(opts?: { indexes?: string | string[] }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const items = async function* () {
      for await (const batch of self.allDocs({ chunkSize: 100 })) {
        for (const d of batch) {
          yield d;
        }
      }
    };

    await this.indexSet.reindex(this.mapper, items(), opts?.indexes);
  }

  async stats(): Promise<Record<string, IndexStats>> {
    const out: Record<string, IndexStats> = {};
    for (const idx of this.indexSet.list()) {
      out[idx.name] = await idx.stats();
    }
    return out;
  }
}
