import { describe, it, expect } from 'vitest';
import { Bm25SearchIndex } from '../bm25-search-index';
import type { IndexRecord, DocId } from '../interfaces';

async function* recs(): AsyncIterable<IndexRecord> {
  yield { id: 'a' as DocId, fields: { title: 'Alpha', text: 'quick brown fox' } };
  yield { id: 'b' as DocId, fields: { title: 'Beta', text: 'slow blue whale' } };
}

describe('Bm25SearchIndex (adapter)', () => {
  it('upserts and finds records by text', async () => {
    const idx = new Bm25SearchIndex();
    await idx.upsert(recs());
    const hits = await idx.search({ text: 'quick fox', topK: 5 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].docId).toBe('a');
    const stats = await idx.stats();
    expect(stats.docCount).toBe(2);
  });
});
