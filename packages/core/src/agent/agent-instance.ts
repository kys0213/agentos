/**
 * Agent 인스턴스 정의
 * 
 * 실행 가능한 Agent 인스턴스와 관련된 상태 및 통계 정보를 관리합니다.
 * Agent 메타데이터를 기반으로 Preset과 결합하여 실제 동작 가능한 Agent를 생성합니다.
 */

import { LlmUsage } from 'llm-bridge-spec';
import { Agent } from './agent';
import { AgentMetadata } from './agent-metadata';
import { Preset } from '../preset/preset';

/**
 * Agent 상태 타입
 * 
 * Agent 인스턴스의 현재 상태를 나타냅니다.
 */
export type AgentStatus = 
  | 'available'    // 사용 가능 (대기 상태)
  | 'busy'         // 실행 중
  | 'idle'         // 유휴 상태 (장시간 미사용)
  | 'error'        // 오류 상태
  | 'maintenance'  // 점검 중
  | 'disabled';    // 비활성화됨

/**
 * Agent 실행 통계
 * 
 * Agent 인스턴스의 실행 기록과 성능 지표를 추적합니다.
 */
export interface AgentStats {
  /** 총 실행 횟수 */
  totalExecutions: number;
  
  /** 성공한 실행 횟수 */
  successfulExecutions: number;
  
  /** 실패한 실행 횟수 */
  failedExecutions: number;
  
  /** 평균 실행 시간 (밀리초) */
  averageExecutionTime: number;
  
  /** 총 사용된 토큰 수 */
  totalTokensUsed: number;
  
  /** 마지막 실행 시간 */
  lastExecutedAt?: Date;
  
  /** 마지막 성공 실행 시간 */
  lastSuccessAt?: Date;
  
  /** 마지막 에러 발생 시간 */
  lastErrorAt?: Date;
  
  /** 총 실행 시간 (밀리초) */
  totalExecutionTime: number;
  
  /** 최대 실행 시간 (밀리초) */
  maxExecutionTime: number;
  
  /** 최소 실행 시간 (밀리초) */
  minExecutionTime: number;
}

/**
 * Agent 인스턴스 설정
 * 
 * Agent 인스턴스의 동작을 제어하는 설정들입니다.
 */
export interface AgentInstanceConfig {
  /** 최대 동시 실행 수 */
  maxConcurrentExecutions?: number;
  
  /** 실행 타임아웃 (밀리초) */
  executionTimeout?: number;
  
  /** 자동 유휴 상태 전환 시간 (밀리초) */
  idleTimeout?: number;
  
  /** 에러 시 재시도 횟수 */
  maxRetries?: number;
  
  /** 재시도 지연 시간 (밀리초) */
  retryDelay?: number;
  
  /** 디버그 모드 활성화 */
  debugMode?: boolean;
  
  /** 실행 로그 보관 기간 (일) */
  logRetentionDays?: number;
}

/**
 * Agent 인스턴스 인터페이스
 * 
 * 실행 가능한 Agent를 나타내며, 메타데이터, Preset, 상태 및 통계를 포함합니다.
 */
export interface AgentInstance {
  /** 인스턴스 고유 식별자 */
  instanceId: string;
  
  /** Agent 메타데이터 참조 */
  metadata: AgentMetadata;
  
  /** 바인딩된 Preset */
  preset: Preset;
  
  /** 현재 Agent 상태 */
  status: AgentStatus;
  
  /** Agent 실행 인터페이스 */
  agent: Agent;
  
  /** 현재 실행 중인 세션들 */
  activeSessions: string[];
  
  /** 인스턴스 생성 시간 */
  createdAt: Date;
  
  /** 마지막 활동 시간 */
  lastActiveAt: Date;
  
  /** 마지막 상태 변경 시간 */
  lastStatusChangeAt: Date;
  
  /** 실행 통계 */
  stats: AgentStats;
  
  /** 인스턴스 설정 */
  config: AgentInstanceConfig;
  
  /** 마지막 에러 정보 */
  lastError?: AgentInstanceError;
}

/**
 * Agent 인스턴스 에러 정보
 * 
 * Agent 실행 중 발생한 에러에 대한 상세 정보를 저장합니다.
 */
export interface AgentInstanceError {
  /** 에러 코드 */
  code: string;
  
  /** 에러 메시지 */
  message: string;
  
  /** 에러 발생 시간 */
  timestamp: Date;
  
  /** 에러 상세 정보 */
  details?: Record<string, unknown>;
  
  /** 에러가 발생한 세션 ID */
  sessionId?: string;
  
  /** 에러 스택 트레이스 */
  stack?: string;
}

/**
 * Agent 인스턴스 생성 옵션
 * 
 * 새로운 Agent 인스턴스를 생성할 때 사용하는 옵션들입니다.
 */
export interface CreateAgentInstanceOptions {
  metadata: AgentMetadata;
  preset: Preset;
  agent: Agent;
  config?: Partial<AgentInstanceConfig>;
}

/**
 * Agent 상태 업데이트 정보
 * 
 * Agent 상태 변경 시 발생하는 이벤트 정보입니다.
 */
export interface AgentStatusUpdate {
  /** 인스턴스 ID */
  instanceId: string;
  
  /** 이전 상태 */
  previousStatus: AgentStatus;
  
  /** 새로운 상태 */
  newStatus: AgentStatus;
  
  /** 상태 변경 시간 */
  timestamp: Date;
  
  /** 상태 변경 이유 */
  reason?: string;
  
  /** 추가 상세 정보 */
  details?: Record<string, unknown>;
}

/**
 * 기본 Agent 인스턴스 설정
 */
export const DEFAULT_AGENT_INSTANCE_CONFIG: AgentInstanceConfig = {
  maxConcurrentExecutions: 3,
  executionTimeout: 300000, // 5분
  idleTimeout: 1800000,     // 30분
  maxRetries: 3,
  retryDelay: 1000,         // 1초
  debugMode: false,
  logRetentionDays: 7,
};

/**
 * 초기 Agent 통계
 */
export const INITIAL_AGENT_STATS: AgentStats = {
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  averageExecutionTime: 0,
  totalTokensUsed: 0,
  totalExecutionTime: 0,
  maxExecutionTime: 0,
  minExecutionTime: 0,
};

/**
 * Agent 인스턴스 팩토리 함수
 * 
 * 새로운 Agent 인스턴스를 생성합니다.
 */
export function createAgentInstance(options: CreateAgentInstanceOptions): AgentInstance {
  const now = new Date();
  const instanceId = `${options.metadata.id}-${options.preset.id}-${now.getTime()}`;
  
  return {
    instanceId,
    metadata: options.metadata,
    preset: options.preset,
    status: 'available',
    agent: options.agent,
    activeSessions: [],
    createdAt: now,
    lastActiveAt: now,
    lastStatusChangeAt: now,
    stats: { ...INITIAL_AGENT_STATS },
    config: { ...DEFAULT_AGENT_INSTANCE_CONFIG, ...options.config },
  };
}

/**
 * Agent 인스턴스 상태 업데이트 함수
 * 
 * Agent 인스턴스의 상태를 업데이트하고 상태 변경 정보를 반환합니다.
 */
export function updateAgentStatus(
  instance: AgentInstance,
  newStatus: AgentStatus,
  reason?: string,
  details?: Record<string, unknown>
): { instance: AgentInstance; update: AgentStatusUpdate } {
  const now = new Date();
  const previousStatus = instance.status;
  
  const updatedInstance: AgentInstance = {
    ...instance,
    status: newStatus,
    lastStatusChangeAt: now,
    lastActiveAt: now,
  };
  
  const update: AgentStatusUpdate = {
    instanceId: instance.instanceId,
    previousStatus,
    newStatus,
    timestamp: now,
    reason,
    details,
  };
  
  return { instance: updatedInstance, update };
}

/**
 * Agent 통계 업데이트 함수
 * 
 * Agent 실행 완료 후 통계를 업데이트합니다.
 */
export function updateAgentStats(
  instance: AgentInstance,
  executionTime: number,
  success: boolean,
  tokenUsage?: LlmUsage
): AgentInstance {
  const stats = instance.stats;
  const newTotalExecutions = stats.totalExecutions + 1;
  const newTotalExecutionTime = stats.totalExecutionTime + executionTime;
  
  const updatedStats: AgentStats = {
    ...stats,
    totalExecutions: newTotalExecutions,
    successfulExecutions: success ? stats.successfulExecutions + 1 : stats.successfulExecutions,
    failedExecutions: success ? stats.failedExecutions : stats.failedExecutions + 1,
    totalExecutionTime: newTotalExecutionTime,
    averageExecutionTime: newTotalExecutionTime / newTotalExecutions,
    maxExecutionTime: Math.max(stats.maxExecutionTime, executionTime),
    minExecutionTime: stats.minExecutionTime === 0 ? executionTime : Math.min(stats.minExecutionTime, executionTime),
    totalTokensUsed: stats.totalTokensUsed + (tokenUsage?.totalTokens || 0),
    lastExecutedAt: new Date(),
    lastSuccessAt: success ? new Date() : stats.lastSuccessAt,
    lastErrorAt: success ? stats.lastErrorAt : new Date(),
  };
  
  return {
    ...instance,
    stats: updatedStats,
    lastActiveAt: new Date(),
  };
}

/**
 * Agent 인스턴스 에러 설정 함수
 * 
 * Agent 인스턴스에 에러 정보를 설정합니다.
 */
export function setAgentInstanceError(
  instance: AgentInstance,
  error: Omit<AgentInstanceError, 'timestamp'>
): AgentInstance {
  const agentError: AgentInstanceError = {
    ...error,
    timestamp: new Date(),
  };
  
  const { instance: updatedInstance } = updateAgentStatus(
    instance,
    'error',
    error.message,
    { code: error.code, details: error.details }
  );
  
  return {
    ...updatedInstance,
    lastError: agentError,
  };
}

/**
 * Agent 인스턴스가 실행 가능한지 확인하는 함수
 */
export function isAgentInstanceAvailable(instance: AgentInstance): boolean {
  if (instance.status !== 'available') {
    return false;
  }
  
  if (!instance.metadata.isEnabled) {
    return false;
  }
  
  const maxConcurrent = instance.config.maxConcurrentExecutions || DEFAULT_AGENT_INSTANCE_CONFIG.maxConcurrentExecutions!;
  if (instance.activeSessions.length >= maxConcurrent) {
    return false;
  }
  
  return true;
}

/**
 * Agent 인스턴스의 성공률을 계산하는 함수
 */
export function calculateSuccessRate(instance: AgentInstance): number {
  if (instance.stats.totalExecutions === 0) {
    return 0;
  }
  
  return (instance.stats.successfulExecutions / instance.stats.totalExecutions) * 100;
}