import { Message, UserMessage } from 'llm-bridge-spec';
import { Preset } from '../preset/preset';
import { AgentMetadata } from './agent-metadata';

/**
 * Agent 상태 타입
 */
export type AgentStatus = 'active' | 'idle' | 'busy' | 'error';

/**
 * Agent 실행 옵션
 */
export interface AgentExecuteOptions {
  abortSignal?: AbortSignal;
  sessionId?: string;
  timeout?: number;
  maxTurnCount?: number;
}

/**
 * Agent 인터페이스
 *
 * Agent의 실행, 메타데이터, 상태 관리를 통합한 완전한 Agent 인터페이스입니다.
 * GUI에서 필요한 모든 정보와 기능을 Agent 하나로 제공합니다.
 */
export interface Agent extends AgentMetadata {
  /** Agent가 사용하는 Preset */
  readonly preset: Readonly<Preset>;

  /** 현재 Agent 상태 */
  readonly status: AgentStatus;

  /** 마지막 활동 시간 */
  readonly lastActivity?: Date;

  /** 현재 처리 중인 세션 수 */
  readonly sessionCount: number;

  /**
   * Agent를 실행합니다.
   *
   * @param messages - 입력 메시지들
   * @param options - 실행 옵션
   * @returns 응답 메시지들
   */
  run(messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentRunResult>;
}

export type AgentRunResult = {
  messages: Message[];
  sessionId: string;
};
