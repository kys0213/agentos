import type { Agent } from '../../agent/agent';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';
import type { CoreContent } from '../../chat/content';
import type { Tokenizer } from '../../knowledge/tokenizer';

// 플랫폼 비의존 라우팅 입력(최소 신호 + 선택적 파생 피처)
export interface RouterQuery {
  text?: string;
  content?: CoreContent[];
  tags?: string[];
  hints?: string[];
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
  helpers: { tokenize: Tokenizer; buildDoc?: BuildDocFn };
}) => Promise<Map<string, ScoreResult>>;
