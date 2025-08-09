import { Message, UserMessage } from 'llm-bridge-spec';
import { AgentMetadata } from './agent-metadata';

/**
 * Agent 상태 타입
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
 * GUI에서 필요한 모든 정보와 기능을 Agent 하나로 제공합니다.
 */
export interface Agent extends AgentMetadata {
  /**
   * Agent를 실행합니다.
   *
   * @param messages - 입력 메시지들
   * @param options - 실행 옵션
   * @returns 응답 메시지들
   */
  chat(messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentChatResult>;

  idle(): Promise<void>;

  activate(): Promise<void>;

  inactive(): Promise<void>;

  endSession(sessionId: string): Promise<void>;
}

export type AgentChatResult = {
  messages: Message[];
  sessionId: string;
};
