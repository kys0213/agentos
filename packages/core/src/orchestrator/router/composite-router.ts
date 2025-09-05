import type { Agent } from '../../agent/agent';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';
import type { Tokenizer, KeywordExtractor } from '../../knowledge/tokenizer';
import { EnglishSimpleTokenizer } from 'src/knowledge/english-simple-tokenizer';
import type {
  AgentRouter,
  BuildDocFn,
  RouterOutput,
  RouterQuery,
  RoutingStrategyFn,
  LlmRoutingPolicy,
  LlmReranker,
} from './types';
import type { RankComparator } from './types';
import { allowByStatus, buildSafeDoc } from './utils';
import { aggregateResults, rankCandidates, toRouterOutput } from './engine';
import { RouterHelper } from './helper';
import { RouterContextBuilder } from './context-builder';

export interface CompositeAgentRouterOptions {
  tokenizer?: Tokenizer;
  buildDoc?: BuildDocFn;
  llmKeyword?: {
    extractor: KeywordExtractor;
    maxKeywords?: number;
    when?: 'always' | 'locale_cjk' | 'never';
  };
  llm?: {
    policy: LlmRoutingPolicy;
    keywordExtractor?: KeywordExtractor;
    reranker?: LlmReranker;
  };
  compare?: RankComparator;
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

    // 전략 실행 컨텍스트(토큰/문서 캐시 포함)를 Builder로 생성
    const builder = new RouterContextBuilder(this.tokenizer, this.buildDoc, {
      llmKeyword: this.options?.llmKeyword,
    });

    const helper = builder.build(query);

    const strategyResults = await Promise.all(
      this.strategies.map((fn) => fn({ query, metas: candidates.map((c) => c.meta), helper }))
    );

    // 점수 합산
    const total = aggregateResults(strategyResults);

    // 후보 정렬 (결정적)
    let ranked = rankCandidates(candidates, total, query, this.options?.compare);

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
          if (score < reMin) {
            reMin = score;
          }
          if (score > reMax) {
            reMax = score;
          }
        }
        const d = Math.max(reMax - reMin, 1e-9);
        // Blend scores for candidates in Top-N
        const blended = ranked.map((r) => {
          if (!reMap.has(r.meta.id)) {
            return r;
          }
          const rnorm = (reMap.get(r.meta.id)! - reMin) / d;
          const score = alpha * r.score + (1 - alpha) * rnorm;
          return { ...r, score };
        });
        const totalMap: Map<string, { score: number; breakdown: Record<string, number> }> = new Map(
          blended.map((r) => [r.meta.id, { score: r.score, breakdown: r.breakdown }])
        );
        ranked = rankCandidates(
          blended.map((r) => ({ agent: r.agent, meta: r.meta })),
          totalMap,
          query,
          this.options?.compare
        );
      } catch {
        // ignore rerank errors; keep rule-based ranking
      }
    }

    const top = ranked.slice(0, topK);

    return toRouterOutput(top, Boolean(options?.includeScores));
  }
}
