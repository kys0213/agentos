import type {
  DocumentMapper,
  IndexRecord,
  IndexSet,
  KnowledgeDoc,
  MergePolicy,
  Query,
  SearchHit,
  SearchIndex,
} from './interfaces';

export class DefaultIndexSet implements IndexSet {
  private readonly indexes: SearchIndex[];

  constructor(indexes: SearchIndex[]) {
    this.indexes = indexes.slice();
  }

  list(): SearchIndex[] {
    return this.indexes.slice();
  }

  get(name: string): SearchIndex | undefined {
    return this.indexes.find((i) => i.name === name);
  }

  async search(q: Query, opts?: { indexes?: string[]; merge?: MergePolicy }): Promise<SearchHit[]> {
    const selected = opts?.indexes?.length
      ? this.indexes.filter((i) => opts.indexes?.includes(i.name))
      : this.indexes;

    const resultsByIndex: Record<string, SearchHit[]> = {};
    await Promise.all(
      selected.map(async (idx) => {
        const hits = await idx.search(q);
        resultsByIndex[idx.name] = hits;
      })
    );

    if (selected.length === 1) {
      return resultsByIndex[selected[0].name] ?? [];
    }

    const topK = q.topK ?? 10;
    if (opts?.merge) {
      return opts.merge.merge(resultsByIndex, topK);
    }
    // Default merge: Reciprocal Rank Fusion (simple)
    return rrfMerge(resultsByIndex, topK);
  }

  async reindex(
    mapper: DocumentMapper,
    docs: AsyncIterable<KnowledgeDoc>,
    target?: string | string[]
  ): Promise<void> {
    let targets: SearchIndex[];
    if (!target) {
      targets = this.indexes;
    } else if (Array.isArray(target)) {
      targets = this.indexes.filter((i) => target.includes(i.name));
    } else {
      targets = this.indexes.filter((i) => i.name === target);
    }

    for await (const doc of docs) {
      const records: AsyncIterable<IndexRecord> = mapper.toRecords(doc);
      await Promise.all(targets.map((idx) => idx.upsert(records)));
    }
  }
}

// Simple RRF merge implementation
export function rrfMerge(resultsByIndex: Record<string, SearchHit[]>, topK: number): SearchHit[] {
  const k = 60; // typical RRF constant
  const scoreMap = new Map<string, { score: number; hit: SearchHit }>();
  for (const list of Object.values(resultsByIndex)) {
    list.forEach((hit, rank) => {
      const inc = 1 / (k + rank + 1);
      const prev = scoreMap.get(hit.docId);
      const total = (prev?.score ?? 0) + inc;
      scoreMap.set(hit.docId, { score: total, hit });
    });
  }
  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.hit);
}
