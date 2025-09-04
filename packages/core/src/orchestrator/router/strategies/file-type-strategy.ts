import type { RoutingStrategyFn, ScoreResult } from '../types';

// FileTypeStrategy: if query includes non-text content types, boost agents with matching categories/tools
export const FileTypeStrategy: RoutingStrategyFn = async ({ query, metas }) => {
  const res = new Map<string, ScoreResult>();
  const types = new Set<string>();
  for (const c of query.content ?? []) {
    if (c?.contentType && c.contentType !== 'text') {
      types.add(c.contentType);
    }
  }

  if (types.size === 0) {
    for (const m of metas) res.set(m.id, { score: 0 });
    return res;
  }

  const prefers = (m: typeof metas[number]) => {
    const cats = (m.preset?.category ?? []).map((c) => c.toLowerCase());
    const tools = m.preset?.enabledMcps?.flatMap((mc) => mc.enabledTools) ?? [];
    const toolTokens = tools
      .flatMap((t) => [t?.name?.toLowerCase(), t?.title?.toLowerCase()])
      .filter(Boolean) as string[];
    const bag = new Set<string>([...cats, ...toolTokens]);
    let hit = 0;
    for (const t of types) {
      if (
        bag.has(t) ||
        (t === 'image' && (bag.has('vision') || bag.has('image'))) ||
        (t === 'audio' && bag.has('audio')) ||
        (t === 'video' && bag.has('video')) ||
        (t === 'file' && bag.has('file')) ||
        bag.has('multimodal')
      ) {
        hit++;
      }
    }
    return hit;
  };

  for (const m of metas) {
    const hit = prefers(m);
    const score = Math.min(0.2, hit * 0.1);
    res.set(m.id, { score, metadata: score > 0 ? { reason: 'filetype', types: Array.from(types) } : undefined });
  }
  return res;
};

