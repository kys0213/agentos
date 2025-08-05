/**
 * Agent 레지스트리 인터페이스
 *
 * Agent 메타데이터와 인스턴스를 관리하는 중앙 레지스트리 인터페이스입니다.
 * Agent의 등록, 조회, 검색, 인스턴스 생성 등의 기능을 제공합니다.
 */

import {
  AgentMetadata,
  AgentSearchQuery,
  CreateAgentMetadataOptions,
  UpdateAgentMetadataOptions,
} from './agent-metadata';
import { AgentInstance, AgentStatus, CreateAgentInstanceOptions } from './agent-instance';
import { Preset } from '../preset/preset';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';

/**
 * Agent 레지스트리 인터페이스
 *
 * Agent 메타데이터와 인스턴스의 생명주기를 관리하는 중앙 레지스트리입니다.
 */
export interface AgentRegistry {
  // ============ Agent 메타데이터 관리 ============

  /**
   * Agent 메타데이터를 레지스트리에 등록합니다.
   *
   * @param metadata - 등록할 Agent 메타데이터
   * @throws {AgentRegistryError} Agent ID가 이미 존재하는 경우
   */
  registerMetadata(metadata: CreateAgentMetadataOptions): Promise<AgentMetadata>;

  /**
   * Agent 메타데이터를 업데이트합니다.
   *
   * @param agentId - 업데이트할 Agent ID
   * @param updates - 업데이트할 필드들
   * @throws {AgentRegistryError} Agent를 찾을 수 없는 경우
   */
  updateMetadata(agentId: string, updates: UpdateAgentMetadataOptions): Promise<AgentMetadata>;

  /**
   * Agent 메타데이터를 레지스트리에서 제거합니다.
   *
   * @param agentId - 제거할 Agent ID
   * @throws {AgentRegistryError} Agent를 찾을 수 없거나 활성 인스턴스가 있는 경우
   */
  unregisterMetadata(agentId: string): Promise<void>;

  /**
   * 특정 Agent의 메타데이터를 조회합니다.
   *
   * @param agentId - 조회할 Agent ID
   * @returns Agent 메타데이터 또는 null
   */
  getMetadata(agentId: string): Promise<AgentMetadata | null>;

  /**
   * 모든 Agent 메타데이터를 조회합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 페이지네이션된 Agent 메타데이터 목록
   */
  getAllMetadata(pagination?: CursorPagination): Promise<CursorPaginationResult<AgentMetadata>>;

  /**
   * Agent를 검색합니다.
   *
   * @param query - 검색 조건
   * @param pagination - 페이지네이션 옵션
   * @returns 검색 결과
   */
  searchMetadata(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentMetadata>>;

  // ============ Agent 인스턴스 관리 ============

  /**
   * Agent 인스턴스를 생성합니다.
   *
   * @param agentId - Agent ID
   * @param preset - 사용할 Preset
   * @param options - 추가 인스턴스 생성 옵션
   * @throws {AgentRegistryError} Agent 메타데이터를 찾을 수 없는 경우
   */
  createInstance(
    agentId: string,
    preset: Preset,
    options?: Partial<CreateAgentInstanceOptions>
  ): Promise<AgentInstance>;

  /**
   * Agent 인스턴스를 제거합니다.
   *
   * @param instanceId - 제거할 인스턴스 ID
   * @throws {AgentRegistryError} 인스턴스를 찾을 수 없거나 실행 중인 경우
   */
  removeInstance(instanceId: string): Promise<void>;

  /**
   * 특정 Agent 인스턴스를 조회합니다.
   *
   * @param instanceId - 조회할 인스턴스 ID
   * @returns Agent 인스턴스 또는 null
   */
  getInstance(instanceId: string): Promise<AgentInstance | null>;

  /**
   * Agent ID로 해당 Agent의 모든 인스턴스를 조회합니다.
   *
   * @param agentId - Agent ID
   * @param pagination - 페이지네이션 옵션
   * @returns Agent 인스턴스 목록
   */
  getInstancesByAgent(
    agentId: string,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentInstance>>;

  /**
   * Preset ID로 해당 Preset을 사용하는 모든 인스턴스를 조회합니다.
   *
   * @param presetId - Preset ID
   * @param pagination - 페이지네이션 옵션
   * @returns Agent 인스턴스 목록
   */
  getInstancesByPreset(
    presetId: string,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentInstance>>;

  /**
   * 모든 Agent 인스턴스를 조회합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 모든 Agent 인스턴스
   */
  getAllInstances(pagination?: CursorPagination): Promise<CursorPaginationResult<AgentInstance>>;

  /**
   * 상태별로 Agent 인스턴스를 조회합니다.
   *
   * @param status - 조회할 상태
   * @param pagination - 페이지네이션 옵션
   * @returns 해당 상태의 Agent 인스턴스들
   */
  getInstancesByStatus(
    status: AgentStatus,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentInstance>>;

  /**
   * 활성 상태인 Agent 인스턴스들을 조회합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 활성 Agent 인스턴스들
   */
  getActiveInstances(pagination?: CursorPagination): Promise<CursorPaginationResult<AgentInstance>>;

  /**
   * 사용 가능한 Agent 인스턴스들을 조회합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @returns 사용 가능한 Agent 인스턴스들
   */
  getAvailableInstances(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentInstance>>;

  // ============ Agent 상태 관리 ============

  /**
   * Agent 인스턴스의 상태를 업데이트합니다.
   *
   * @param instanceId - 인스턴스 ID
   * @param status - 새로운 상태
   * @param reason - 상태 변경 이유
   * @param details - 추가 상세 정보
   * @throws {AgentRegistryError} 인스턴스를 찾을 수 없는 경우
   */
  updateInstanceStatus(
    instanceId: string,
    status: AgentStatus,
    reason?: string,
    details?: Record<string, unknown>
  ): Promise<AgentInstance>;

  /**
   * Agent 인스턴스에 활성 세션을 추가합니다.
   *
   * @param instanceId - 인스턴스 ID
   * @param sessionId - 세션 ID
   * @throws {AgentRegistryError} 인스턴스를 찾을 수 없는 경우
   */
  addActiveSession(instanceId: string, sessionId: string): Promise<AgentInstance>;

  /**
   * Agent 인스턴스에서 활성 세션을 제거합니다.
   *
   * @param instanceId - 인스턴스 ID
   * @param sessionId - 세션 ID
   * @throws {AgentRegistryError} 인스턴스를 찾을 수 없는 경우
   */
  removeActiveSession(instanceId: string, sessionId: string): Promise<AgentInstance>;

  // ============ 통계 및 모니터링 ============

  /**
   * 레지스트리 통계를 조회합니다.
   *
   * @returns 레지스트리 통계 정보
   */
  getRegistryStats(): Promise<AgentRegistryStats>;

  /**
   * 특정 Agent의 통계를 조회합니다.
   *
   * @param agentId - Agent ID
   * @returns Agent 통계 정보
   */
  getAgentStats(agentId: string): Promise<AgentRegistryAgentStats>;

  // ============ 이벤트 구독 ============

  /**
   * Agent 레지스트리 이벤트를 구독합니다.
   *
   * @param eventType - 구독할 이벤트 타입
   * @param callback - 이벤트 콜백 함수
   * @returns 구독 해제 함수
   */
  subscribe(eventType: AgentRegistryEventType, callback: AgentRegistryEventCallback): () => void;

  /**
   * 특정 Agent의 이벤트를 구독합니다.
   *
   * @param agentId - Agent ID
   * @param eventType - 구독할 이벤트 타입
   * @param callback - 이벤트 콜백 함수
   * @returns 구독 해제 함수
   */
  subscribeToAgent(
    agentId: string,
    eventType: AgentRegistryEventType,
    callback: AgentRegistryEventCallback
  ): () => void;
}

/**
 * Agent 레지스트리 통계
 */
export interface AgentRegistryStats {
  /** 등록된 Agent 메타데이터 수 */
  totalAgents: number;

  /** 활성 Agent 메타데이터 수 */
  activeAgents: number;

  /** 총 인스턴스 수 */
  totalInstances: number;

  /** 상태별 인스턴스 수 */
  instancesByStatus: Record<AgentStatus, number>;

  /** 카테고리별 Agent 수 */
  agentsByCategory: Record<string, number>;

  /** 평균 성공률 */
  averageSuccessRate: number;

  /** 총 실행 횟수 */
  totalExecutions: number;

  /** 총 토큰 사용량 */
  totalTokensUsed: number;
}

/**
 * Agent 레지스트리 Agent 통계
 */
export interface AgentRegistryAgentStats {
  /** Agent ID */
  agentId: string;

  /** 인스턴스 수 */
  instanceCount: number;

  /** 총 실행 횟수 */
  totalExecutions: number;

  /** 성공한 실행 횟수 */
  successfulExecutions: number;

  /** 평균 실행 시간 */
  averageExecutionTime: number;

  /** 총 토큰 사용량 */
  totalTokensUsed: number;

  /** 마지막 사용 시간 */
  lastUsedAt?: Date;

  /** 성공률 */
  successRate: number;
}

/**
 * Agent 레지스트리 이벤트 타입
 */
export type AgentRegistryEventType =
  | 'agent-registered' // Agent 등록됨
  | 'agent-unregistered' // Agent 등록 해제됨
  | 'agent-updated' // Agent 메타데이터 업데이트됨
  | 'instance-created' // 인스턴스 생성됨
  | 'instance-removed' // 인스턴스 제거됨
  | 'instance-status-changed' // 인스턴스 상태 변경됨
  | 'session-added' // 세션 추가됨
  | 'session-removed' // 세션 제거됨
  | 'stats-updated'; // 통계 업데이트됨

/**
 * Agent 레지스트리 이벤트
 */
export interface AgentRegistryEvent {
  /** 이벤트 타입 */
  type: AgentRegistryEventType;

  /** 이벤트 발생 시간 */
  timestamp: Date;

  /** 관련 Agent ID */
  agentId?: string;

  /** 관련 인스턴스 ID */
  instanceId?: string;

  /** 이벤트 데이터 */
  data?: unknown;

  /** 이벤트 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * Agent 레지스트리 이벤트 콜백
 */
export type AgentRegistryEventCallback = (event: AgentRegistryEvent) => void | Promise<void>;

/**
 * Agent 레지스트리 에러
 */
export class AgentRegistryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentRegistryError';
  }
}

/**
 * Agent 레지스트리 에러 코드
 */
export const AGENT_REGISTRY_ERROR_CODES = {
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_ALREADY_EXISTS: 'AGENT_ALREADY_EXISTS',
  INSTANCE_NOT_FOUND: 'INSTANCE_NOT_FOUND',
  INSTANCE_ALREADY_EXISTS: 'INSTANCE_ALREADY_EXISTS',
  INSTANCE_IN_USE: 'INSTANCE_IN_USE',
  INVALID_AGENT_ID: 'INVALID_AGENT_ID',
  INVALID_INSTANCE_ID: 'INVALID_INSTANCE_ID',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  PRESET_NOT_COMPATIBLE: 'PRESET_NOT_COMPATIBLE',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

/**
 * Agent 레지스트리 헬퍼 함수들
 */

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

/**
 * 인스턴스 ID 생성
 */
export function generateInstanceId(agentId: string, presetId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${agentId}-${presetId}-${timestamp}-${random}`;
}

/**
 * Agent 호환성 확인
 */
export function isPresetCompatible(metadata: AgentMetadata, _preset: Preset): boolean {
  // 필수 기능 확인
  if (metadata.requiredCapabilities && metadata.requiredCapabilities.length > 0) {
    // 실제 구현에서는 Preset이 제공하는 기능과 비교
    // 여기서는 간단히 true 반환
    return true;
  }

  return true;
}
