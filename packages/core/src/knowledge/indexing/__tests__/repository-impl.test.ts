import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { tmpdir } from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
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

function randomDir() {
  return path.join(tmpdir(), `kb_test_${Math.random().toString(36).slice(2, 8)}`);
}

async function rimraf(p: string) {
  try {
    await fs.rm(p, { recursive: true, force: true });
  } catch {}
}

describe('KnowledgeRepositoryImpl', () => {
  let base: string;

  beforeEach(async () => {
    base = randomDir();
    await fs.mkdir(base, { recursive: true });
  });

  afterEach(async () => {
    await rimraf(base);
  });

  it('creates, gets, lists, and deletes knowledge bases', async () => {
    const repo = new KnowledgeRepositoryImpl({
      rootDir: base,
      mapper,
      makeIndexSet: () => new DefaultIndexSet([new Bm25SearchIndex()]),
    });

    const kb = await repo.create({ name: 'Test KB' });
    const stats = await kb.stats();
    expect(stats['bm25']).toBeDefined();

    const listed = await repo.list();
    expect(listed.items.length).toBe(1);

    const same = await repo.get(kb.id as any);
    expect(same).not.toBeNull();

    // add doc and query
    const doc = await kb.addDoc({ title: 'Doc1', source: { kind: 'text', text: 'hello world' } });
    const hits = await kb.query({ text: 'hello', topK: 5 });
    expect(hits.length).toBeGreaterThan(0);
    expect(String(hits[0].docId)).toBe(String(doc.id));

    // iterate all docs in chunks
    const seen: string[] = [];
    for await (const batch of kb.allDocs({ chunkSize: 1 })) {
      for (const d of batch) {
        seen.push(String(d.id));
      }
    }
    expect(seen).toContain(String(doc.id));

    await repo.delete(kb.id as any);
    const listed2 = await repo.list();
    expect(listed2.items.length).toBe(0);
  });
});
