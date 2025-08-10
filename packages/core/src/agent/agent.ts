import { Message, UserMessage } from 'llm-bridge-spec';
import { AgentMetadata, ReadonlyAgentMetadata } from './agent-metadata';

/**
 * Agent 상태 타입
 *
 * - active: 활성 상태 입니다. 대화 중 자동으로 해당 에이전트가 호출될 수 있습니다.
 * - idle: 대기 상태입니다. 직접 메션으로 해당 에이전트를 호출할 수 있습니다.
 * - inactive: 비활성 상태입니다. 대화 중 자동으로 해당 에이전트가 호출되지 않습니다.
 * - error: 오류 상태입니다. 에이전트가 오류 상태가 되면 대화 중 자동으로 해당 에이전트가 호출되지 않습니다.
 */
export type AgentStatus = 'active' | 'idle' | 'inactive' | 'error';

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
 */
export interface Agent {
  readonly id: string;

  /**
   * Agent를 실행합니다.
   *
   * @param messages - 입력 메시지들
   * @param options - 실행 옵션
   * @returns 응답 메시지들
   */
  chat(messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentChatResult>;

  /**
   * Agent의 메타데이터를 가져옵니다.
   */
  getMetadata(): Promise<ReadonlyAgentMetadata>;

  /**
   * Agent가 활성 상태인지 확인합니다.
   */
  isActive(): Promise<boolean>;

  /**
   * Agent가 대기 상태인지 확인합니다.
   */
  isIdle(): Promise<boolean>;

  /**
   * Agent가 대기 상태인지 확인합니다.
   */
  isIdle(): Promise<boolean>;

  /**
   * Agent가 비활성 상태인지 확인합니다.
   */
  isInactive(): Promise<boolean>;

  /**
   * Agent가 오류 상태인지 확인합니다.
   */
  isError(): Promise<boolean>;

  /**
   * Agent를 대기 상태로 전환합니다.
   */
  idle(): Promise<void>;

  /**
   * Agent를 활성 상태로 전환합니다.
   */
  activate(): Promise<void>;

  /**
   * Agent를 비활성 상태로 전환합니다.
   */
  inactive(): Promise<void>;

  /**
   * Agent의 세션을 종료합니다.
   *
   * @param sessionId - 세션 ID
   */
  endSession(sessionId: string): Promise<void>;
}

export type AgentChatResult = {
  messages: Message[];
  sessionId: string;
};
