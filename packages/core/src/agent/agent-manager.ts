/**
 * Agent 매니저 인터페이스
 *
 * Agent의 실행, 모니터링, 큐 관리를 담당하는 고수준 매니저 인터페이스입니다.
 * AgentRegistry와 함께 Agent 시스템의 핵심을 구성합니다.
 */

import { UserMessage, Message } from 'llm-bridge-spec';
import { AgentInstance, AgentStatus } from './agent-instance';
import { AgentExecutionContext, ExecutionStatus, ExecutionStep } from './agent-execution-context';
import { AgentRegistry } from './agent-registry';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';

/**
 * Agent 매니저 인터페이스
 *
 * Agent 실행의 최상위 인터페이스로, 실행 요청부터 결과 반환까지의
 * 전체 라이프사이클을 관리합니다.
 */
export interface AgentManager {
  // ============ Agent 실행 관리 ============

  /**
   * Agent를 실행합니다.
   *
   * @param agentId - 실행할 Agent ID
   * @param presetId - 사용할 Preset ID
   * @param messages - 입력 메시지들
   * @param options - 실행 옵션
   * @returns 실행 컨텍스트
   * @throws {AgentManagerError} Agent나 Preset을 찾을 수 없거나 실행에 실패한 경우
   */
  execute(
    agentId: string,
    presetId: string,
    messages: UserMessage[],
    options?: ExecutionOptions
  ): Promise<AgentExecutionContext>;

  /**
   * Agent를 비동기로 실행합니다.
   *
   * @param agentId - 실행할 Agent ID
   * @param presetId - 사용할 Preset ID
   * @param messages - 입력 메시지들
   * @param options - 실행 옵션
   * @returns 실행 컨텍스트 (실행은 백그라운드에서 진행)
   * @throws {AgentManagerError} Agent나 Preset을 찾을 수 없는 경우
   */
  executeAsync(
    agentId: string,
    presetId: string,
    messages: UserMessage[],
    options?: ExecutionOptions
  ): Promise<AgentExecutionContext>;

  /**
   * Agent 실행을 스트리밍으로 진행합니다.
   *
   * @param agentId - 실행할 Agent ID
   * @param presetId - 사용할 Preset ID
   * @param messages - 입력 메시지들
   * @param options - 실행 옵션
   * @returns 실행 컨텍스트 스트림
   * @throws {AgentManagerError} Agent나 Preset을 찾을 수 없는 경우
   */
  executeStream(
    agentId: string,
    presetId: string,
    messages: UserMessage[],
    options?: ExecutionOptions
  ): AsyncIterable<AgentExecutionContext>;

  /**
   * 실행 중인 Agent를 중단합니다.
   *
   * @param executionId - 중단할 실행 ID
   * @param reason - 중단 이유
   * @throws {AgentManagerError} 실행을 찾을 수 없거나 중단할 수 없는 경우
   */
  cancelExecution(executionId: string, reason?: string): Promise<void>;

  /**
   * 실행 대기열에 있는 모든 실행을 취소합니다.
   *
   * @param agentId - Agent ID (선택사항, 지정하면 해당 Agent의 실행만 취소)
   */
  cancelPendingExecutions(agentId?: string): Promise<void>;

  // ============ 실행 컨텍스트 조회 ============

  /**
   * 실행 컨텍스트를 조회합니다.
   *
   * @param executionId - 실행 ID
   * @returns 실행 컨텍스트 또는 null
   */
  getExecutionContext(executionId: string): Promise<AgentExecutionContext | null>;

  /**
   * Agent의 실행 이력을 조회합니다.
   *
   * @param agentId - Agent ID
   * @param options - 조회 옵션
   * @returns 실행 이력
   */
  getExecutionHistory(
    agentId: string,
    options?: ExecutionHistoryOptions
  ): Promise<CursorPaginationResult<AgentExecutionContext>>;

  /**
   * 현재 실행 중인 모든 컨텍스트를 조회합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 실행 중인 컨텍스트들
   */
  getRunningExecutions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentExecutionContext>>;

  /**
   * 실행 대기열을 조회합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 대기 중인 실행들
   */
  getPendingExecutions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentExecutionContext>>;

  /**
   * 완료된 실행들을 조회합니다.
   *
   * @param options - 조회 옵션
   * @returns 완료된 실행들
   */
  getCompletedExecutions(
    options?: CompletedExecutionOptions
  ): Promise<CursorPaginationResult<AgentExecutionContext>>;

  // ============ Agent 상태 모니터링 ============

  /**
   * Agent의 상태를 실시간으로 모니터링합니다.
   *
   * @param agentId - 모니터링할 Agent ID
   * @returns Agent 상태 업데이트 스트림
   */
  monitorAgent(agentId: string): AsyncIterable<AgentManagerStatusUpdate>;

  /**
   * Agent 실행을 실시간으로 모니터링합니다.
   *
   * @param executionId - 모니터링할 실행 ID
   * @returns 실행 컨텍스트 업데이트 스트림
   */
  monitorExecution(executionId: string): AsyncIterable<AgentExecutionContext>;

  /**
   * 모든 Agent의 상태를 모니터링합니다.
   *
   * @returns 전체 Agent 상태 업데이트 스트림
   */
  monitorAllAgents(): AsyncIterable<AgentManagerStatusUpdate>;

  // ============ 큐 및 스케줄링 관리 ============

  /**
   * 실행 큐의 상태를 조회합니다.
   *
   * @returns 큐 상태 정보
   */
  getQueueStatus(): Promise<ExecutionQueueStatus>;

  /**
   * 실행 우선순위를 변경합니다.
   *
   * @param executionId - 실행 ID
   * @param priority - 새로운 우선순위
   * @throws {AgentManagerError} 실행을 찾을 수 없거나 우선순위를 변경할 수 없는 경우
   */
  updateExecutionPriority(executionId: string, priority: number): Promise<void>;

  /**
   * Agent 실행을 예약합니다.
   *
   * @param agentId - Agent ID
   * @param presetId - Preset ID
   * @param messages - 입력 메시지들
   * @param scheduledAt - 실행 예정 시간
   * @param options - 실행 옵션
   * @returns 예약된 실행 ID
   */
  scheduleExecution(
    agentId: string,
    presetId: string,
    messages: UserMessage[],
    scheduledAt: Date,
    options?: ExecutionOptions
  ): Promise<string>;

  /**
   * 예약된 실행을 취소합니다.
   *
   * @param scheduledExecutionId - 예약된 실행 ID
   */
  cancelScheduledExecution(scheduledExecutionId: string): Promise<void>;

  // ============ 통계 및 성능 ============

  /**
   * Agent 매니저 통계를 조회합니다.
   *
   * @returns 매니저 통계 정보
   */
  getManagerStats(): Promise<AgentManagerStats>;

  /**
   * Agent별 성능 메트릭을 조회합니다.
   *
   * @param agentId - Agent ID
   * @param timeRange - 시간 범위
   * @returns 성능 메트릭
   */
  getAgentMetrics(agentId: string, timeRange?: TimeRange): Promise<AgentMetrics>;

  /**
   * 시스템 전체 성능 메트릭을 조회합니다.
   *
   * @param timeRange - 시간 범위
   * @returns 시스템 메트릭
   */
  getSystemMetrics(timeRange?: TimeRange): Promise<SystemMetrics>;

  // ============ 이벤트 구독 ============

  /**
   * Agent 매니저 이벤트를 구독합니다.
   *
   * @param eventType - 구독할 이벤트 타입
   * @param callback - 이벤트 콜백
   * @returns 구독 해제 함수
   */
  subscribe(eventType: AgentManagerEventType, callback: AgentManagerEventCallback): () => void;

  /**
   * 특정 실행의 이벤트를 구독합니다.
   *
   * @param executionId - 실행 ID
   * @param callback - 이벤트 콜백
   * @returns 구독 해제 함수
   */
  subscribeToExecution(executionId: string, callback: ExecutionEventCallback): () => void;
}

/**
 * 실행 옵션
 */
export interface ExecutionOptions {
  /** 실행 타임아웃 (밀리초) */
  timeout?: number;

  /** 실행 우선순위 (높을수록 먼저 실행) */
  priority?: number;

  /** 단계 추적 활성화 */
  trackSteps?: boolean;

  /** 디버그 모드 */
  debugMode?: boolean;

  /** 세션 ID */
  sessionId?: string;

  /** 사용자 ID */
  userId?: string;

  /** 실행 태그들 */
  tags?: string[];

  /** 추가 컨텍스트 */
  context?: Record<string, unknown>;

  /** 취소 신호 */
  abortSignal?: AbortSignal;

  /** 재시도 설정 */
  retry?: RetryOptions;

  /** 실행 모드 */
  mode?: ExecutionMode;
}

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  /** 최대 재시도 횟수 */
  maxRetries: number;

  /** 재시도 지연 시간 (밀리초) */
  delay: number;

  /** 지수 백오프 사용 여부 */
  exponentialBackoff?: boolean;

  /** 재시도 가능한 에러 코드들 */
  retryableErrors?: string[];
}

/**
 * 실행 모드
 */
export type ExecutionMode =
  | 'sync' // 동기 실행
  | 'async' // 비동기 실행
  | 'stream' // 스트리밍 실행
  | 'queue' // 큐에 추가
  | 'schedule'; // 예약 실행

/**
 * 실행 이력 조회 옵션
 */
export interface ExecutionHistoryOptions extends CursorPagination {
  /** 상태 필터 */
  status?: ExecutionStatus[];

  /** 시작 시간 범위 */
  startTimeRange?: TimeRange;

  /** 완료 시간 범위 */
  endTimeRange?: TimeRange;

  /** 사용자 ID 필터 */
  userId?: string;

  /** 세션 ID 필터 */
  sessionId?: string;

  /** 태그 필터 */
  tags?: string[];

  /** 정렬 기준 */
  sortBy?: 'startedAt' | 'completedAt' | 'duration' | 'priority';

  /** 정렬 순서 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 완료된 실행 조회 옵션
 */
export interface CompletedExecutionOptions extends CursorPagination {
  /** Agent ID 필터 */
  agentId?: string;

  /** 성공 여부 필터 */
  success?: boolean;

  /** 완료 시간 범위 */
  completedTimeRange?: TimeRange;

  /** 최소 실행 시간 (밀리초) */
  minDuration?: number;

  /** 최대 실행 시간 (밀리초) */
  maxDuration?: number;
}

/**
 * 시간 범위
 */
export interface TimeRange {
  /** 시작 시간 */
  from: Date;

  /** 종료 시간 */
  to: Date;
}

/**
 * 실행 큐 상태
 */
export interface ExecutionQueueStatus {
  /** 대기 중인 실행 수 */
  pendingCount: number;

  /** 실행 중인 수 */
  runningCount: number;

  /** 최대 동시 실행 수 */
  maxConcurrent: number;

  /** 큐 처리율 (실행/분) */
  throughput: number;

  /** 평균 대기 시간 (밀리초) */
  averageWaitTime: number;

  /** 평균 실행 시간 (밀리초) */
  averageExecutionTime: number;

  /** 큐 상태 */
  queueHealth: 'healthy' | 'degraded' | 'critical';
}

/**
 * Agent 매니저 상태 업데이트
 */
export interface AgentManagerStatusUpdate {
  /** Agent ID */
  agentId: string;

  /** 인스턴스 ID */
  instanceId?: string;

  /** 이전 상태 */
  previousStatus: AgentStatus;

  /** 새로운 상태 */
  newStatus: AgentStatus;

  /** 업데이트 시간 */
  timestamp: Date;

  /** 상태 변경 이유 */
  reason?: string;

  /** 추가 정보 */
  details?: Record<string, unknown>;
}

/**
 * Agent 매니저 통계
 */
export interface AgentManagerStats {
  /** 총 실행 수 */
  totalExecutions: number;

  /** 성공한 실행 수 */
  successfulExecutions: number;

  /** 실패한 실행 수 */
  failedExecutions: number;

  /** 취소된 실행 수 */
  cancelledExecutions: number;

  /** 평균 실행 시간 (밀리초) */
  averageExecutionTime: number;

  /** 총 처리 시간 (밀리초) */
  totalProcessingTime: number;

  /** 큐 처리율 (실행/분) */
  throughput: number;

  /** 에러율 (%) */
  errorRate: number;

  /** 활성 Agent 수 */
  activeAgentCount: number;

  /** 사용 가능한 Agent 수 */
  availableAgentCount: number;
}

/**
 * Agent 메트릭
 */
export interface AgentMetrics {
  /** Agent ID */
  agentId: string;

  /** 실행 수 */
  executionCount: number;

  /** 성공률 (%) */
  successRate: number;

  /** 평균 실행 시간 (밀리초) */
  averageExecutionTime: number;

  /** 최소 실행 시간 (밀리초) */
  minExecutionTime: number;

  /** 최대 실행 시간 (밀리초) */
  maxExecutionTime: number;

  /** 총 토큰 사용량 */
  totalTokenUsage: number;

  /** 평균 토큰 사용량 */
  averageTokenUsage: number;

  /** 마지막 실행 시간 */
  lastExecutionTime?: Date;

  /** 실행 빈도 (실행/시간) */
  executionFrequency: number;
}

/**
 * 시스템 메트릭
 */
export interface SystemMetrics {
  /** CPU 사용률 (%) */
  cpuUsage: number;

  /** 메모리 사용률 (%) */
  memoryUsage: number;

  /** 총 처리 시간 (밀리초) */
  totalProcessingTime: number;

  /** 평균 응답 시간 (밀리초) */
  averageResponseTime: number;

  /** 처리량 (요청/분) */
  throughput: number;

  /** 에러율 (%) */
  errorRate: number;

  /** 활성 연결 수 */
  activeConnections: number;

  /** 큐 대기 시간 (밀리초) */
  queueWaitTime: number;
}

/**
 * Agent 매니저 이벤트 타입
 */
export type AgentManagerEventType =
  | 'execution-started' // 실행 시작됨
  | 'execution-completed' // 실행 완료됨
  | 'execution-failed' // 실행 실패함
  | 'execution-cancelled' // 실행 취소됨
  | 'execution-queued' // 실행이 큐에 추가됨
  | 'execution-dequeued' // 실행이 큐에서 제거됨
  | 'agent-status-changed' // Agent 상태 변경됨
  | 'queue-status-changed' // 큐 상태 변경됨
  | 'metrics-updated'; // 메트릭 업데이트됨

/**
 * Agent 매니저 이벤트
 */
export interface AgentManagerEvent {
  /** 이벤트 타입 */
  type: AgentManagerEventType;

  /** 이벤트 발생 시간 */
  timestamp: Date;

  /** 관련 실행 ID */
  executionId?: string;

  /** 관련 Agent ID */
  agentId?: string;

  /** 이벤트 데이터 */
  data?: unknown;

  /** 이벤트 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * 실행 이벤트
 */
export interface ExecutionEvent {
  /** 실행 ID */
  executionId: string;

  /** 이벤트 타입 */
  type: 'step-started' | 'step-completed' | 'step-failed' | 'progress-updated' | 'status-changed';

  /** 이벤트 발생 시간 */
  timestamp: Date;

  /** 현재 단계 */
  currentStep?: ExecutionStep;

  /** 진행률 */
  progress?: number;

  /** 이벤트 데이터 */
  data?: unknown;
}

/**
 * Agent 매니저 이벤트 콜백
 */
export type AgentManagerEventCallback = (event: AgentManagerEvent) => void | Promise<void>;

/**
 * 실행 이벤트 콜백
 */
export type ExecutionEventCallback = (event: ExecutionEvent) => void | Promise<void>;

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
  PRESET_NOT_FOUND: 'PRESET_NOT_FOUND',
  EXECUTION_NOT_FOUND: 'EXECUTION_NOT_FOUND',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  EXECUTION_TIMEOUT: 'EXECUTION_TIMEOUT',
  EXECUTION_CANCELLED: 'EXECUTION_CANCELLED',
  QUEUE_FULL: 'QUEUE_FULL',
  INVALID_EXECUTION_OPTIONS: 'INVALID_EXECUTION_OPTIONS',
  AGENT_UNAVAILABLE: 'AGENT_UNAVAILABLE',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
  INVALID_PRIORITY: 'INVALID_PRIORITY',
  SCHEDULING_FAILED: 'SCHEDULING_FAILED',
} as const;
