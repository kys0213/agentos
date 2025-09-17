import type { RoutingStrategyFn, ScoreResult } from '../types';

// MentionStrategy: direct mention via hints matching agent name or id
export const MentionStrategy: RoutingStrategyFn = async ({ query, metas }) => {
  const res = new Map<string, ScoreResult>();
  const hints = (query.routingHints ?? []).map((h) => h.toLowerCase());
  for (const m of metas) {
    const names = [m.name?.toLowerCase(), m.id?.toLowerCase()].filter(Boolean) as string[];
    const hit = names.some((n) => hints.includes(n));
    res.set(m.id, {
      score: hit ? 1 : 0,
      metadata: hit ? { reason: 'mention' } : undefined,
    });
  }
  return res;
};
