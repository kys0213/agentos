import type { Agent } from '../../agent/agent';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';
import type { Message } from 'llm-bridge-spec';
import type { RouterHelper } from './helper';

// 플랫폼 비의존 라우팅 입력(최소 신호 + 선택적 파생 피처)
export interface RouterQuery {
  text?: string;
  messages?: Message[];
  tags?: string[];
  routingHints?: string[];
  locale?: string;
  meta?: Record<string, unknown>;
}

export interface RouterOutput {
  agents: Agent[];
  scores?: Array<{ agentId: string; score: number; metadata?: Record<string, unknown> }>;
}

export interface AgentRouter {
  route(
    query: RouterQuery,
    agents: Agent[],
    options?: { topK?: number; includeScores?: boolean }
  ): Promise<RouterOutput>;
}

export interface DocBuilderOptions {
  promptLimit?: number; // 기본 512자
}

export type BuildDocFn = (meta: ReadonlyAgentMetadata, options?: DocBuilderOptions) => string;

export interface ScoreResult {
  score: number; // [0,1] 권장
  metadata?: Record<string, unknown>;
}

export type RoutingStrategyFn = (args: {
  query: RouterQuery;
  metas: ReadonlyAgentMetadata[];
  helper: RouterHelper;
}) => Promise<Map<string, ScoreResult>>;

export type RankItem = {
  agent: Agent;
  meta: ReadonlyAgentMetadata;
  score: number;
  breakdown: Record<string, number>;
};

export type RankComparator = (a: RankItem, b: RankItem) => number;

// LLM-assisted routing types
export interface LlmRoutingPolicy {
  enableKeyword: boolean;
  enableIntent?: boolean;
  enableRerank?: boolean;
  topN?: number;
  timeoutMs?: number;
  localeMode?: 'always' | 'cjk' | 'never';
  alphaBlend?: number; // weight for rule score in [0,1], default 0.6
}

export interface LlmReranker {
  rerank(args: {
    query: RouterQuery;
    candidates: Array<{ agentId: string; doc: string }>;
    helper: RouterHelper;
    policy: LlmRoutingPolicy;
  }): Promise<Array<{ agentId: string; score: number }>>; // score in [0,1]
}
