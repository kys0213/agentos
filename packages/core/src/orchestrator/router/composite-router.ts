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
  LlmRoutingPolicy,
  LlmReranker,
} from './types';
import { allowByStatus, buildSafeDoc, getQueryText, statusOrder } from './utils';
import { RouterHelper } from './helper';

export interface CompositeAgentRouterOptions {
  tokenizer?: Tokenizer;
  buildDoc?: BuildDocFn;
  llmKeyword?: { extractor: import('../../knowledge/tokenizer').KeywordExtractor; maxKeywords?: number; when?: 'always' | 'locale_cjk' | 'never' };
  llm?: {
    policy: LlmRoutingPolicy;
    keywordExtractor?: import('../../knowledge/tokenizer').KeywordExtractor;
    reranker?: LlmReranker;
  };
}

export class CompositeAgentRouter implements AgentRouter {
  private readonly strategies: RoutingStrategyFn[];
  private readonly tokenizer: Tokenizer;
  private readonly buildDoc?: BuildDocFn;
  private readonly options?: CompositeAgentRouterOptions;

  constructor(strategies: RoutingStrategyFn[], options?: CompositeAgentRouterOptions) {
    this.strategies = strategies;
    this.tokenizer = options?.tokenizer ?? new EnglishSimpleTokenizer();
    this.buildDoc = options?.buildDoc ?? buildSafeDoc;
    this.options = options;
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

    // 전략 실행 (헬퍼 객체로 토큰/문서 캐시 포함)
    const helper = new RouterHelper(this.tokenizer, this.buildDoc);
    // LLM keyword policy: prefer options.llm; fallback to llmKeyword for backward compat
    const llmOpt = this.options?.llm;
    if (llmOpt?.policy?.enableKeyword && llmOpt.keywordExtractor) {
      helper.configureLlm(llmOpt.keywordExtractor, {
        maxKeywords: undefined,
        when: (llmOpt.policy.localeMode === 'always' ? 'always' : llmOpt.policy.localeMode === 'cjk' ? 'locale_cjk' : 'never'),
      });
    } else if ((this as any).options?.llmKeyword) {
      const { extractor, maxKeywords, when } = (this as any).options.llmKeyword;
      helper.configureLlm(extractor, { maxKeywords, when });
    }
    helper.setQueryContext(query);
    const strategyResults = await Promise.all(
      this.strategies.map((fn) => fn({ query, metas: candidates.map((c) => c.meta), helper }))
    );

    // 점수 합산
    const total = this.aggregate(strategyResults);

    // 후보 정렬 (결정적)
    let ranked = this.rank(candidates, total, query);

    // Optional LLM rerank step on Top-N
    const policy = this.options?.llm?.policy;
    const reranker = this.options?.llm?.reranker;
    if (policy?.enableRerank && reranker) {
      try {
        const topN = Math.max(1, Math.min(policy.topN ?? 5, ranked.length));
        const alpha = Math.max(0, Math.min(policy.alphaBlend ?? 0.6, 1));
        const topSlice = ranked.slice(0, topN);
        const docs = topSlice.map((r) => ({ agentId: r.meta.id, doc: helper.buildDoc(r.meta) }));
        const re = await reranker.rerank({ query, candidates: docs, helper, policy });
        const reMap = new Map<string, number>();
        let reMin = Infinity;
        let reMax = -Infinity;
        for (const { agentId, score } of re) {
          reMap.set(agentId, score);
          if (score < reMin) reMin = score;
          if (score > reMax) reMax = score;
        }
        const d = Math.max(reMax - reMin, 1e-9);
        // Blend scores for candidates in Top-N
        const blended = ranked.map((r) => {
          if (!reMap.has(r.meta.id)) return r;
          const rnorm = (reMap.get(r.meta.id)! - reMin) / d;
          const score = alpha * r.score + (1 - alpha) * rnorm;
          return { ...r, score };
        });
        ranked = blended.sort((a, b) => {
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
      } catch {
        // ignore rerank errors; keep rule-based ranking
      }
    }

    const top = ranked.slice(0, topK);

    return this.toOutput(top, Boolean(options?.includeScores));
  }

  private aggregate(
    strategyResults: Map<string, { score: number }>[]
  ): Map<string, { score: number; breakdown: Record<string, number> }> {
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

  private rank(
    candidates: { agent: Agent; meta: ReadonlyAgentMetadata }[],
    total: Map<string, { score: number; breakdown: Record<string, number> }>,
    query: RouterQuery
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
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const sa = statusOrder(a.meta.status);
        const sb = statusOrder(b.meta.status);
        if (sa !== sb) {
          return sa - sb;
        }
        const la = a.meta.lastUsed ? new Date(a.meta.lastUsed).getTime() : 0;
        const lb = b.meta.lastUsed ? new Date(b.meta.lastUsed).getTime() : 0;
        if (lb !== la) {
          return lb - la;
        }
        if (b.meta.usageCount !== a.meta.usageCount) {
          return b.meta.usageCount - a.meta.usageCount;
        }
        const na = (a.meta.name ?? '').localeCompare(b.meta.name ?? '');
        if (na !== 0) {
          return na;
        }
        return (a.meta.id ?? '').localeCompare(b.meta.id ?? '');
      });
  }

  private toOutput(
    top: Array<{
      agent: Agent;
      meta: ReadonlyAgentMetadata;
      score: number;
      breakdown: Record<string, number>;
    }>,
    includeScores: boolean
  ) {
    return {
      agents: top.map((r) => r.agent),
      scores: includeScores
        ? top.map((r) => ({
            agentId: r.meta.id,
            score: r.score,
            metadata: { breakdown: r.breakdown },
          }))
        : undefined,
    };
  }
}
