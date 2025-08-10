/**
 * Agent 매니저 인터페이스
 *
 * Agent의 등록, 관리, 실행을 담당하는 통합 매니저 인터페이스입니다.
 * Agent 시스템의 중심 역할을 하며 GUI에서 필요한 모든 Agent 관련 기능을 제공합니다.
 */

import { UserMessage } from 'llm-bridge-spec';
import { Agent, AgentStatus, AgentExecuteOptions, AgentChatResult } from './agent';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';

/**
 * Agent 검색 쿼리
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

/**
 * Agent 매니저 인터페이스
 *
 * Agent의 등록, 관리, 실행을 담당하는 통합 인터페이스입니다.
 * GUI에서 필요한 모든 Agent 관련 기능을 하나의 인터페이스로 제공합니다.
 */
export interface AgentManager {
  /**
   * Agent를 등록합니다.
   *
   * @param agent - 등록할 Agent
   * @throws {AgentManagerError} Agent ID가 이미 존재하는 경우
   */
  register(agent: Agent): Promise<void>;

  /**
   * Agent를 등록 해제합니다.
   *
   * @param agentId - 등록 해제할 Agent ID
   * @throws {AgentManagerError} Agent를 찾을 수 없거나 실행 중인 경우
   */
  unregister(agentId: string): Promise<void>;

  /**
   * 특정 Agent를 조회합니다.
   *
   * @param agentId - 조회할 Agent ID
   * @returns Agent 또는 null
   */
  getAgent(agentId: string): Promise<Agent | null>;

  /**
   * 모든 Agent를 조회합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 모든 Agent 목록
   */
  getAllAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>>;

  /**
   * 사용 가능한 Agent들을 조회합니다 (status가 'active' 또는 'idle').
   * GUI에서 사용자에게 보여줄 Agent 목록을 가져올 때 사용합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 사용 가능한 Agent 목록
   */
  getAvailableAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>>;

  /**
   * 현재 활성 상태인 Agent들을 조회합니다 (status가 'active' 또는 'busy').
   * GUI에서 현재 실행 중인 Agent 목록을 보여줄 때 사용합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 활성 Agent 목록
   */
  getActiveAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>>;

  /**
   * Agent를 실행합니다.
   *
   * @param agentId - 실행할 Agent ID
   * @param messages - 입력 메시지들
   * @param options - 실행 옵션
   * @returns 응답 메시지들
   * @throws {AgentManagerError} Agent를 찾을 수 없거나 실행에 실패한 경우
   */
  execute(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult>;

  /**
   * Agent의 현재 상태를 조회합니다.
   *
   * @param agentId - Agent ID
   * @returns Agent 상태
   * @throws {AgentManagerError} Agent를 찾을 수 없는 경우
   */
  getAgentStatus(agentId: string): Promise<AgentStatus>;

  /**
   * Agent 세션을 종료합니다.
   *
   * @param agentId - Agent ID
   * @param sessionId - 종료할 세션 ID
   * @throws {AgentManagerError} Agent를 찾을 수 없는 경우
   */
  endAgentSession(agentId: string, sessionId: string): Promise<void>;

  /**
   * 전체 Agent 통계를 조회합니다.
   *
   * @returns Agent 통계 정보
   */
  getStats(): Promise<AgentManagerStats>;
}

/**
 * Agent 매니저 통계
 */
export interface AgentManagerStats {
  /** 총 등록된 Agent 수 */
  totalAgents: number;

  /** 상태별 Agent 수 */
  agentsByStatus: Record<AgentStatus, number>;

  /** 총 활성 세션 수 */
  totalActiveSessions: number;

  /** 마지막 활동이 있었던 시간 */
  lastActivity?: Date;
}

/**
 * Agent 매니저 에러
 */
export class AgentManagerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentManagerError';
  }
}

/**
 * Agent 매니저 에러 코드
 */
export const AGENT_MANAGER_ERROR_CODES = {
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_ALREADY_EXISTS: 'AGENT_ALREADY_EXISTS',
  AGENT_EXECUTION_FAILED: 'AGENT_EXECUTION_FAILED',
  INVALID_AGENT_ID: 'INVALID_AGENT_ID',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

/**
 * Agent ID 유효성 검사
 */
export function validateAgentId(agentId: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/.test(agentId) &&
    agentId.length >= 2 &&
    agentId.length <= 64
  );
}
