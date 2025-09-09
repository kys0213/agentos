import type { DocId, IndexRecord, IndexStats, Query, SearchHit, SearchIndex } from './interfaces';
import { InMemoryBM25Index } from '../bm25/bm25-index';
import { EnglishSimpleTokenizer } from '../english-simple-tokenizer';

function asDocId(id: string): DocId {
  return id as DocId;
}

/**
 * SearchIndex adapter backed by the existing in-memory BM25 index.
 * Concatenates `fields.title` and `fields.text` for scoring when available.
 */
export class Bm25SearchIndex implements SearchIndex {
  public readonly name = 'bm25';
  private readonly bm25 = new InMemoryBM25Index<string>({
    tokenizer: new EnglishSimpleTokenizer(),
  });
  private readonly present = new Set<string>();

  async upsert(records: AsyncIterable<IndexRecord>): Promise<void> {
    for await (const r of records) {
      const id = String(r.id);
      // simple text composition: prefer explicit text; fallback to title
      const title = typeof r.fields['title'] === 'string' ? (r.fields['title'] as string) : '';
      const text = typeof r.fields['text'] === 'string' ? (r.fields['text'] as string) : '';
      const body = text || title;
      if (body) {
        // replace semantics: remove then add, to keep TF/length fresh
        if (this.present.has(id)) {
          await this.bm25.remove(id);
        }
        await this.bm25.add(id, body);
        this.present.add(id);
      }
    }
  }

  async remove(id: DocId): Promise<void> {
    const s = String(id);
    if (this.present.has(s)) {
      await this.bm25.remove(s);
      this.present.delete(s);
    }
  }

  async removeMany(ids: DocId[] | Iterable<DocId>): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  async removeByGenerator(ids: AsyncIterable<DocId>): Promise<void> {
    for await (const id of ids) {
      await this.remove(id);
    }
  }

  async removeAll(): Promise<void> {
    const ids = Array.from(this.present.values());
    for (const id of ids) {
      await this.bm25.remove(id);
      this.present.delete(id);
    }
  }

  async search(query: Query): Promise<SearchHit[]> {
    const q = query.text ?? '';
    if (!q) {
      return [];
    }
    const topK = query.topK ?? 10;
    const hits = await this.bm25.search(q, topK);
    return hits.map((h) => ({ docId: asDocId(h.chunkId), score: h.score, indexName: this.name }));
  }

  async reindex(allRecords: AsyncIterable<IndexRecord>): Promise<void> {
    // simple approach: clear present set and rebuild by upsert
    this.present.clear();
    await this.upsert(allRecords);
  }

  async stats(): Promise<IndexStats> {
    return { docCount: this.present.size, lastBuiltAt: undefined };
  }
}
