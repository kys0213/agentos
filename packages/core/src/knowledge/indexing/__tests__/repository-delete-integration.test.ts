import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { KnowledgeRepositoryImpl } from '../repository-impl';
import { DefaultIndexSet } from '../index-set';
import { Bm25SearchIndex } from '../bm25-search-index';
import type { DocumentMapper, KnowledgeDoc, IndexRecord } from '../interfaces';

const mapper: DocumentMapper = {
  async *toRecords(doc: KnowledgeDoc) {
    const text = doc.source.kind === 'text' ? doc.source.text : '';
    yield { id: doc.id, fields: { title: doc.title, text } } satisfies IndexRecord;
  },
};

async function rimraf(p: string) {
  try { await fs.rm(p, { recursive: true, force: true }); } catch {}
}

describe('Repository + Bm25SearchIndex deletion integration', () => {
  let base: string;

  beforeEach(async () => {
    base = path.join(tmpdir(), `kb_repo_del_${Math.random().toString(36).slice(2, 8)}`);
    await fs.mkdir(base, { recursive: true });
  });

  afterEach(async () => { await rimraf(base); });

  it('reflects bm25 stats after add and delete', async () => {
    const repo = new KnowledgeRepositoryImpl({
      rootDir: base,
      mapper,
      makeIndexSet: () => new DefaultIndexSet([new Bm25SearchIndex()]),
    });
    const kb = await repo.create({ name: 'T' });

    const d1 = await kb.addDoc({ title: 'A', source: { kind: 'text', text: 'alpha' } });
    const d2 = await kb.addDoc({ title: 'B', source: { kind: 'text', text: 'beta' } });

    const stats1 = await kb.stats();
    expect(stats1['bm25']?.docCount).toBe(2);

    await kb.deleteDoc(d1.id);
    await kb.deleteDoc(d2.id);
    const stats2 = await kb.stats();
    expect(stats2['bm25']?.docCount).toBe(0);
  });
});

