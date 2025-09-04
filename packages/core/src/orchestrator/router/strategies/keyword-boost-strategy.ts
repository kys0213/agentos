import type { RoutingStrategyFn, ScoreResult } from '../types';
import { getQueryText } from '../utils';

// KeywordBoostStrategy: overlap of query tokens with keywords/categories
export const KeywordBoostStrategy: RoutingStrategyFn = async ({ query, metas, helpers }) => {
  const res = new Map<string, ScoreResult>();
  const q = getQueryText(query);
  const qTokens = new Set<string>(q ? await helpers.tokenize.tokenize(q) : []);

  for (const m of metas) {
    const keywords = (m.keywords ?? []).map((k) => k.toLowerCase());
    const cats = (m.preset?.category ?? []).map((c) => c.toLowerCase());
    const tokens = new Set<string>([...keywords, ...cats]);
    let overlap = 0;
    if (qTokens.size > 0 && tokens.size > 0) {
      for (const t of tokens) {
        if (qTokens.has(t)) overlap++;
      }
    }
    // 0.05 per overlap, capped to 0.2
    const score = Math.min(0.2, overlap * 0.05);
    res.set(m.id, {
      score,
      metadata: score > 0 ? { reason: 'keyword_overlap', overlap } : undefined,
    });
  }
  return res;
};

