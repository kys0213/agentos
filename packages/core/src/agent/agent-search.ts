import type { AgentStatus } from './agent';

/**
 * Agent 검색 쿼리 (공용)
 */
export interface AgentSearchQuery {
  /** 키워드 검색 */
  keywords?: string[];

  /** 상태 필터 */
  status?: AgentStatus;

  /** 이름으로 검색 */
  name?: string;

  /** 설명에서 검색 */
  description?: string;
}

