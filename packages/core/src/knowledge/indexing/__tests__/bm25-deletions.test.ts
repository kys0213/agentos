import { describe, it, expect } from 'vitest';
import { Bm25SearchIndex } from '../bm25-search-index';
import type { IndexRecord } from '../interfaces';

async function* recs(): AsyncIterable<IndexRecord> {
  yield { id: 'a', fields: { title: 'Alpha', text: 'alpha text' } };
  yield { id: 'b', fields: { title: 'Beta', text: 'beta text' } };
}

async function* recs2(): AsyncIterable<IndexRecord> {
  yield { id: 'e', fields: { title: 'Echo', text: 'echo text' } };
  yield { id: 'f', fields: { title: 'Foxtrot', text: 'foxtrot text' } };
}

describe('Bm25SearchIndex deletions API', () => {
  it('supports remove, removeMany, removeByGenerator, and removeAll', async () => {
    const idx = new Bm25SearchIndex();

    await idx.upsert(recs());
    expect((await idx.stats()).docCount).toBe(2);

    await idx.remove('a');
    expect((await idx.stats()).docCount).toBe(1);

    await idx.removeMany(['b']);
    expect((await idx.stats()).docCount).toBe(0);

    await idx.upsert(recs2());
    expect((await idx.stats()).docCount).toBe(2);

    // remove one via generator
    await idx.removeByGenerator(
      (async function* () {
        yield 'e';
      })()
    );
    expect((await idx.stats()).docCount).toBe(1);

    await idx.removeAll();
    expect((await idx.stats()).docCount).toBe(0);
  });
});
