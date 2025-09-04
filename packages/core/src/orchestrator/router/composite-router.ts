import type { Agent } from '../../agent/agent';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';
import type { Tokenizer } from '../../knowledge/tokenizer';
import { EnglishSimpleTokenizer } from '../../knowledge/tokenizer';
import type {
  AgentRouter,
  BuildDocFn,
  RouterOutput,
  RouterQuery,
  RoutingStrategyFn,
  ScoreResult,
} from './types';
import { allowByStatus, buildSafeDoc, getQueryText, statusOrder } from './utils';

export interface CompositeAgentRouterOptions {
  tokenizer?: Tokenizer;
  buildDoc?: BuildDocFn;
}

export class CompositeAgentRouter implements AgentRouter {
  private readonly strategies: RoutingStrategyFn[];
  private readonly tokenizer: Tokenizer;
  private readonly buildDoc?: BuildDocFn;

  constructor(strategies: RoutingStrategyFn[], options?: CompositeAgentRouterOptions) {
    this.strategies = strategies;
    this.tokenizer = options?.tokenizer ?? new EnglishSimpleTokenizer();
    this.buildDoc = options?.buildDoc ?? buildSafeDoc;
  }

  async route(
    query: RouterQuery,
    agents: Agent[],
    options?: { topK?: number; includeScores?: boolean }
  ): Promise<RouterOutput> {
    const topK = Math.max(1, Math.floor(options?.topK ?? 1));

    // 수집 및 상태 게이팅
    const metas: ReadonlyAgentMetadata[] = await Promise.all(agents.map((a) => a.getMetadata()));
    const candidates: { agent: Agent; meta: ReadonlyAgentMetadata }[] = [];
    for (let i = 0; i < agents.length; i++) {
      if (allowByStatus(metas[i], query)) {
        candidates.push({ agent: agents[i], meta: metas[i] });
      }
    }
    if (candidates.length === 0) {
      return { agents: [] };
    }

    // 전략 실행
    // Simple per-call caches for tokens and docs
    const tokenCache = new Map<string, string[]>();
    const docCache = new Map<string, string>();
    const cachedTokenizer: Tokenizer = {
      tokenize: async (text: string) => {
        const key = text ?? '';
        if (tokenCache.has(key)) return tokenCache.get(key)!;
        const tokens = await this.tokenizer.tokenize(text);
        tokenCache.set(key, tokens);
        return tokens;
      },
    };
    const cachedBuildDoc: BuildDocFn | undefined = this.buildDoc
      ? (meta) => {
          const key = `${meta.id}:${meta.version ?? 'v0'}`;
          const hit = docCache.get(key);
          if (hit) return hit;
          const d = this.buildDoc!(meta);
          docCache.set(key, d);
          return d;
        }
      : undefined;

    const helper = { tokenize: cachedTokenizer, buildDoc: cachedBuildDoc };
    const strategyResults = await Promise.all(
      this.strategies.map((fn) =>
        fn({ query, metas: candidates.map((c) => c.meta), helpers: helper })
      )
    );

    // 점수 합산
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

    // 후보 정렬 (결정적)
    const qText = getQueryText(query);
    const ranked = candidates
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

    const top = ranked.slice(0, topK);
    return {
      agents: top.map((r) => r.agent),
      scores: options?.includeScores
        ? top.map((r) => ({
            agentId: r.meta.id,
            score: r.score,
            metadata: { breakdown: r.breakdown },
          }))
        : undefined,
    };
  }
}
