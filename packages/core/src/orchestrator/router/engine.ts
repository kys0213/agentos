import type { Agent } from '../../agent/agent';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';
import type { RouterQuery } from './types';
import { getQueryText, statusOrder } from './utils';

export type AggregatedScores = Map<string, { score: number; breakdown: Record<string, number> }>;

export function aggregateResults(
  strategyResults: Map<string, { score: number }>[],
): AggregatedScores {
  const total = new Map<string, { score: number; breakdown: Record<string, number> }>();
  strategyResults.forEach((res, idx) => {
    const key = `s${idx}`;
    for (const [agentId, s] of res.entries()) {
      const prev = total.get(agentId) ?? { score: 0, breakdown: {} };
      prev.score += s.score ?? 0;
      prev.breakdown[key] = s.score ?? 0;
      total.set(agentId, prev);
    }
  });
  return total;
}

export function rankCandidates(
  candidates: { agent: Agent; meta: ReadonlyAgentMetadata }[],
  total: AggregatedScores,
  query: RouterQuery,
) {
  const qText = getQueryText(query);
  return candidates
    .map(({ agent, meta }) => ({
      agent,
      meta,
      score: total.get(meta.id)?.score ?? 0,
      breakdown: total.get(meta.id)?.breakdown ?? {},
      qTextLen: qText.length,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const sa = statusOrder(a.meta.status);
      const sb = statusOrder(b.meta.status);
      if (sa !== sb) return sa - sb;
      const la = a.meta.lastUsed ? new Date(a.meta.lastUsed).getTime() : 0;
      const lb = b.meta.lastUsed ? new Date(b.meta.lastUsed).getTime() : 0;
      if (lb !== la) return lb - la;
      if (b.meta.usageCount !== a.meta.usageCount) return b.meta.usageCount - a.meta.usageCount;
      const na = (a.meta.name ?? '').localeCompare(b.meta.name ?? '');
      if (na !== 0) return na;
      return (a.meta.id ?? '').localeCompare(b.meta.id ?? '');
    });
}

export function toRouterOutput(
  ranked: Array<{ agent: Agent; meta: ReadonlyAgentMetadata; score: number; breakdown: Record<string, number> }>,
  includeScores: boolean,
) {
  return {
    agents: ranked.map((r) => r.agent),
    scores: includeScores
      ? ranked.map((r) => ({ agentId: r.meta.id, score: r.score, metadata: { breakdown: r.breakdown } }))
      : undefined,
  };
}

