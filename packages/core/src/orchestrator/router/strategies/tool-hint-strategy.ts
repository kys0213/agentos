import type { RoutingStrategyFn, ScoreResult } from '../types';

// ToolHintStrategy: hints matching enabled tool titles/names
export const ToolHintStrategy: RoutingStrategyFn = async ({ query, metas }) => {
  const res = new Map<string, ScoreResult>();
  const hints = (query.hints ?? []).map((h) => h.toLowerCase());

  for (const m of metas) {
    const tools = m.preset?.enabledMcps?.flatMap((mc) => mc.enabledTools) ?? [];
    const tokens = new Set<string>();
    for (const t of tools) {
      if (t?.name) {
        tokens.add(t.name.toLowerCase());
      }
      if (t?.title) {
        tokens.add(t.title.toLowerCase());
      }
    }
    let hits = 0;
    if (hints.length && tokens.size) {
      for (const h of hints) {
        if (tokens.has(h)) {
          hits++;
        }
      }
    }
    const score = Math.min(0.2, hits * 0.1);
    res.set(m.id, { score, metadata: score > 0 ? { reason: 'tool_hint', hits } : undefined });
  }
  return res;
};
