/**
 * Agent 실행 컨텍스트 정의
 * 
 * Agent 실행 과정을 추적하고 관리하기 위한 인터페이스들입니다.
 * GUI에서 오케스트레이션 과정을 시각화하고 실행 상태를 모니터링하는데 사용됩니다.
 */

import { LlmUsage, UserMessage, Message } from 'llm-bridge-spec';
import { AgentInstance } from './agent-instance';
import { ChatSession } from '../chat/chat-session';

/**
 * 실행 상태 타입
 * 
 * Agent 실행의 현재 상태를 나타냅니다.
 */
export type ExecutionStatus = 
  | 'pending'    // 대기 중
  | 'running'    // 실행 중
  | 'completed'  // 완료됨
  | 'failed'     // 실패함
  | 'cancelled'  // 취소됨
  | 'timeout';   // 타임아웃

/**
 * 실행 단계 타입
 * 
 * Agent 실행 과정에서 발생하는 각 단계의 타입을 정의합니다.
 */
export type ExecutionStepType = 
  | 'initialization'     // 초기화
  | 'input-validation'   // 입력 검증
  | 'preprocessing'      // 전처리
  | 'analysis'          // 분석
  | 'tool-selection'    // 도구 선택
  | 'tool-execution'    // 도구 실행
  | 'response-generation' // 응답 생성
  | 'postprocessing'    // 후처리
  | 'finalization';     // 완료 처리

/**
 * 실행 단계 인터페이스
 * 
 * Agent 실행 과정의 각 단계에 대한 상세 정보를 담습니다.
 */
export interface ExecutionStep {
  /** 단계 고유 식별자 */
  id: string;
  
  /** 단계 타입 */
  type: ExecutionStepType;
  
  /** 단계 제목 */
  title: string;
  
  /** 단계 설명 */
  description: string;
  
  /** 단계 시작 시간 */
  startedAt: Date;
  
  /** 단계 완료 시간 */
  completedAt?: Date;
  
  /** 단계 상태 */
  status: ExecutionStatus;
  
  /** 단계별 메타데이터 */
  metadata?: ExecutionStepMetadata;
  
  /** 단계 실행 결과 */
  result?: ExecutionStepResult;
  
  /** 단계 실행 중 발생한 에러 */
  error?: ExecutionStepError;
  
  /** 하위 단계들 */
  subSteps?: ExecutionStep[];
  
  /** 진행률 (0-100) */
  progress?: number;
}

/**
 * 실행 단계별 메타데이터
 * 
 * 각 실행 단계의 구체적인 정보를 담는 유니온 타입입니다.
 */
export type ExecutionStepMetadata = 
  | AnalysisMetadata
  | ToolSelectionMetadata
  | ToolExecutionMetadata
  | ResponseGenerationMetadata;

/**
 * 분석 단계 메타데이터
 */
export interface AnalysisMetadata {
  type: 'analysis';
  confidence: number;
  factors: string[];
  analysisMethod: string;
  inputTokens: number;
}

/**
 * 도구 선택 단계 메타데이터
 */
export interface ToolSelectionMetadata {
  type: 'tool-selection';
  availableTools: string[];
  selectedTools: string[];
  selectionReasoning: string;
  selectionConfidence: number;
}

/**
 * 도구 실행 단계 메타데이터
 */
export interface ToolExecutionMetadata {
  type: 'tool-execution';
  toolName: string;
  toolArguments: Record<string, unknown>;
  executionTime: number;
  retryCount: number;
}

/**
 * 응답 생성 단계 메타데이터
 */
export interface ResponseGenerationMetadata {
  type: 'response-generation';
  promptTokens: number;
  completionTokens: number;
  temperature: number;
  model: string;
  generationTime: number;
}

/**
 * 실행 단계 결과
 */
export interface ExecutionStepResult {
  /** 결과 데이터 */
  data?: unknown;
  
  /** 결과 메시지 */
  message?: string;
  
  /** 결과 점수/신뢰도 */
  score?: number;
  
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * 실행 단계 에러
 */
export interface ExecutionStepError {
  /** 에러 코드 */
  code: string;
  
  /** 에러 메시지 */
  message: string;
  
  /** 에러 상세 정보 */
  details?: Record<string, unknown>;
  
  /** 에러 발생 시간 */
  timestamp: Date;
  
  /** 복구 가능 여부 */
  recoverable: boolean;
  
  /** 재시도 가능 여부 */
  retryable: boolean;
}

/**
 * 실행 에러 정보
 */
export interface ExecutionError {
  /** 에러 코드 */
  code: string;
  
  /** 에러 메시지 */
  message: string;
  
  /** 에러 발생 시간 */
  timestamp: Date;
  
  /** 에러 상세 정보 */
  details?: Record<string, unknown>;
  
  /** 에러가 발생한 단계 ID */
  stepId?: string;
  
  /** 에러 스택 트레이스 */
  stack?: string;
  
  /** 복구 시도 횟수 */
  retryCount?: number;
}

/**
 * Agent 실행 컨텍스트 인터페이스
 * 
 * Agent의 전체 실행 과정과 상태를 추적하는 중앙 컨텍스트입니다.
 */
export interface AgentExecutionContext {
  /** 실행 고유 식별자 */
  executionId: string;
  
  /** Agent 인스턴스 참조 */
  agentInstance: AgentInstance;
  
  /** 채팅 세션 참조 */
  chatSession: ChatSession;
  
  /** 실행 시작 시간 */
  startedAt: Date;
  
  /** 실행 종료 시간 */
  completedAt?: Date;
  
  /** 현재 실행 상태 */
  status: ExecutionStatus;
  
  /** 입력 메시지들 */
  inputMessages: UserMessage[];
  
  /** 출력 메시지들 */
  outputMessages?: Message[];
  
  /** 실행 단계들 */
  steps: ExecutionStep[];
  
  /** 현재 실행 중인 단계 ID */
  currentStepId?: string;
  
  /** 전체 진행률 (0-100) */
  progress: number;
  
  /** 실행 에러 정보 */
  error?: ExecutionError;
  
  /** 토큰 사용량 */
  tokenUsage?: LlmUsage;
  
  /** 실행 설정 */
  config: ExecutionConfig;
  
  /** 실행 메타데이터 */
  metadata: ExecutionMetadata;
  
  /** 취소 신호 */
  abortController?: AbortController;
}

/**
 * 실행 설정
 */
export interface ExecutionConfig {
  /** 실행 타임아웃 (밀리초) */
  timeout?: number;
  
  /** 단계 추적 활성화 여부 */
  trackSteps?: boolean;
  
  /** 디버그 모드 */
  debugMode?: boolean;
  
  /** 최대 재시도 횟수 */
  maxRetries?: number;
  
  /** 재시도 지연 시간 (밀리초) */
  retryDelay?: number;
  
  /** 진행률 업데이트 간격 (밀리초) */
  progressUpdateInterval?: number;
}

/**
 * 실행 메타데이터
 */
export interface ExecutionMetadata {
  /** 실행 유형 */
  executionType: 'direct' | 'queued' | 'scheduled';
  
  /** 실행 우선순위 */
  priority: number;
  
  /** 실행 태그들 */
  tags: string[];
  
  /** 사용자 ID (있는 경우) */
  userId?: string;
  
  /** 세션 ID */
  sessionId: string;
  
  /** 추가 컨텍스트 정보 */
  context?: Record<string, unknown>;
}

/**
 * 실행 컨텍스트 생성 옵션
 */
export interface CreateExecutionContextOptions {
  agentInstance: AgentInstance;
  chatSession: ChatSession;
  inputMessages: UserMessage[];
  config?: Partial<ExecutionConfig>;
  metadata?: Partial<ExecutionMetadata>;
}

/**
 * 기본 실행 설정
 */
export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  timeout: 300000, // 5분
  trackSteps: true,
  debugMode: false,
  maxRetries: 3,
  retryDelay: 1000,
  progressUpdateInterval: 1000,
};

/**
 * 실행 컨텍스트 팩토리 함수
 */
export function createExecutionContext(options: CreateExecutionContextOptions): AgentExecutionContext {
  const now = new Date();
  const executionId = `exec-${options.agentInstance.instanceId}-${now.getTime()}`;
  
  const defaultMetadata: ExecutionMetadata = {
    executionType: 'direct',
    priority: 0,
    tags: [],
    sessionId: options.chatSession.sessionId,
  };
  
  return {
    executionId,
    agentInstance: options.agentInstance,
    chatSession: options.chatSession,
    startedAt: now,
    status: 'pending',
    inputMessages: options.inputMessages,
    steps: [],
    progress: 0,
    config: { ...DEFAULT_EXECUTION_CONFIG, ...options.config },
    metadata: { ...defaultMetadata, ...options.metadata },
    abortController: new AbortController(),
  };
}

/**
 * 실행 단계 생성 함수
 */
export function createExecutionStep(
  type: ExecutionStepType,
  title: string,
  description: string
): ExecutionStep {
  const stepId = `step-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    id: stepId,
    type,
    title,
    description,
    startedAt: new Date(),
    status: 'pending',
    progress: 0,
  };
}

/**
 * 실행 단계 완료 함수
 */
export function completeExecutionStep(
  step: ExecutionStep,
  result?: ExecutionStepResult
): ExecutionStep {
  return {
    ...step,
    status: 'completed',
    completedAt: new Date(),
    result,
    progress: 100,
  };
}

/**
 * 실행 단계 실패 함수
 */
export function failExecutionStep(
  step: ExecutionStep,
  error: Omit<ExecutionStepError, 'timestamp'>
): ExecutionStep {
  return {
    ...step,
    status: 'failed',
    completedAt: new Date(),
    error: {
      ...error,
      timestamp: new Date(),
    },
  };
}

/**
 * 실행 컨텍스트 진행률 계산 함수
 */
export function calculateExecutionProgress(context: AgentExecutionContext): number {
  if (context.steps.length === 0) {
    return 0;
  }
  
  const totalSteps = context.steps.length;
  const completedSteps = context.steps.filter(step => 
    step.status === 'completed'
  ).length;
  
  const runningSteps = context.steps.filter(step => 
    step.status === 'running'
  );
  
  let partialProgress = 0;
  for (const step of runningSteps) {
    partialProgress += (step.progress || 0) / 100;
  }
  
  return Math.min(100, ((completedSteps + partialProgress) / totalSteps) * 100);
}

/**
 * 실행 컨텍스트 완료 함수
 */
export function completeExecutionContext(
  context: AgentExecutionContext,
  outputMessages: Message[],
  tokenUsage?: LlmUsage
): AgentExecutionContext {
  return {
    ...context,
    status: 'completed',
    completedAt: new Date(),
    outputMessages,
    tokenUsage,
    progress: 100,
  };
}

/**
 * 실행 컨텍스트 실패 함수
 */
export function failExecutionContext(
  context: AgentExecutionContext,
  error: Omit<ExecutionError, 'timestamp'>
): AgentExecutionContext {
  return {
    ...context,
    status: 'failed',
    completedAt: new Date(),
    error: {
      ...error,
      timestamp: new Date(),
    },
  };
}

/**
 * 실행 시간 계산 함수
 */
export function calculateExecutionTime(context: AgentExecutionContext): number {
  const endTime = context.completedAt || new Date();
  return endTime.getTime() - context.startedAt.getTime();
}