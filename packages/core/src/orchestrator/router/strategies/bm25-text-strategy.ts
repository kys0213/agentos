import type { RoutingStrategyFn, ScoreResult } from '../types';
import { getQueryText } from '../utils';
import { InMemoryBM25Index } from '../../../knowledge/bm25/bm25-index';

// BM25TextStrategy: index safe docs, search by normalized text, min-max normalize to [0,1]
export const BM25TextStrategy: RoutingStrategyFn = async ({ query, metas, helper }) => {
  const res = new Map<string, ScoreResult>();
  const q = helper.getQueryText(query);
  if (!q || q.trim().length === 0) {
    for (const m of metas) res.set(m.id, { score: 0 });
    return res;
  }

  const index = new InMemoryBM25Index<string>({ tokenizer: { tokenize: (t) => helper.tokenize(t) } });
  for (const m of metas) {
    const doc = helper.buildDoc(m);
    await index.add(m.id, doc);
  }
  const results = await index.search(q, metas.length);
  if (results.length === 0) {
    for (const m of metas) res.set(m.id, { score: 0 });
    return res;
  }

  let min = Infinity;
  let max = -Infinity;
  const scoreMap = new Map<string, number>();
  for (const r of results) {
    scoreMap.set(r.chunkId, r.score);
    if (r.score < min) min = r.score;
    if (r.score > max) max = r.score;
  }
  const denom = Math.max(max - min, 1e-9);
  for (const m of metas) {
    const raw = scoreMap.get(m.id) ?? 0;
    const norm = (raw - min) / denom; // [0,1]
    res.set(m.id, {
      score: norm,
      metadata: raw > 0 ? { reason: 'bm25', raw } : undefined,
    });
  }
  return res;
};
