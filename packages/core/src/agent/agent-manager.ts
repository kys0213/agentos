/**
 * Agent 매니저 인터페이스
 *
 * Agent의 등록, 관리, 실행을 담당하는 통합 매니저 인터페이스입니다.
 * Agent 시스템의 중심 역할을 하며 GUI에서 필요한 모든 Agent 관련 기능을 제공합니다.
 */

import { UserMessage } from 'llm-bridge-spec';
import { Agent, AgentStatus, AgentExecuteOptions, AgentChatResult } from './agent';
import type { AgentSearchQuery } from './agent-search';
import type { AgentSession } from './agent-session';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';
import { CoreError, ErrorCode } from '../common/error/core-error';

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
   * 별칭: Agent 세션 생성 (세션 중심 DX)
   * 기존 API와의 호환성을 유지하면서 세션 중심 워크플로를 지원합니다.
   */
  createAgentSession(
    agentId: string,
    options?: { sessionId?: string; presetId?: string }
  ): Promise<AgentSession>;

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
   * 별칭: Agent 세션 종료 (세션 중심 DX)
   * 기존 endAgentSession의 가독성 개선 버전입니다.
   */
  terminateAgentSession(agentId: string, sessionId: string): Promise<void>;

  /**
   * 전체 Agent 통계를 조회합니다.
   *
   * @returns Agent 통계 정보
   */
  getStats(): Promise<AgentManagerStats>;

  /**
   * 별칭: Agent 검색 (간단한 메타데이터 기반 필터)
   * 저장소 기반 정교한 검색이 도입되기 전까지의 임시 구현을 위한 인터페이스입니다.
   */
  searchAgents(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Agent>>;
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
export class AgentManagerError extends CoreError {
  readonly legacyCode: string;
  constructor(message: string, legacyCode: string, details?: Record<string, unknown>) {
    super('agent_manager', mapLegacyCode(legacyCode), message, { details });
    this.name = 'AgentManagerError';
    this.legacyCode = legacyCode;
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

function mapLegacyCode(code: string): ErrorCode {
  switch (code) {
    case AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND:
      return 'NOT_FOUND';
    case AGENT_MANAGER_ERROR_CODES.AGENT_ALREADY_EXISTS:
      return 'ALREADY_EXISTS';
    case AGENT_MANAGER_ERROR_CODES.INVALID_AGENT_ID:
      return 'INVALID_ARGUMENT';
    case AGENT_MANAGER_ERROR_CODES.AGENT_EXECUTION_FAILED:
      return 'OPERATION_FAILED';
    case AGENT_MANAGER_ERROR_CODES.OPERATION_FAILED:
      return 'OPERATION_FAILED';
    default:
      return 'INTERNAL';
  }
}

// Re-export from Lang package for backward compatibility
import { validation } from '@agentos/lang';

/**
 * Agent ID 유효성 검사
 * @deprecated Use validation.validateAgentId from @agentos/lang instead
 */
export const validateAgentId = validation.validateAgentId;
