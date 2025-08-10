import type {
  CursorPagination,
  CursorPaginationResult,
  ChatSessionDescription,
  MessageHistory,
  AgentExecuteOptions,
  AgentChatResult,
  AgentMetadata,
  CreateAgentMetadata,
} from '@agentos/core';
import { UserMessage } from 'llm-bridge-spec';

// Conversation (chat session + messages) protocol

export interface ConversationProtocol {
  listSessions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<ChatSessionDescription>>;

  getMessages(
    sessionId: string,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>>;

  deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }>;
}

export interface AgentProtocol {
  /**
   * Agent 채팅
   */
  chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult>;

  /**
   * Agent 세션 종료
   */
  endSession(agentId: string, sessionId: string): Promise<void>;

  /**
   * 특정 Agent 조회
   */
  getAgentMetadata(id: string): Promise<AgentMetadata | null>;

  /**
   * 모든 Agent 조회
   */
  getAllAgentMetadatas(): Promise<AgentMetadata[]>;

  /**
   * Agent 업데이트
   */
  updateAgent(agentId: string, agent: Partial<Omit<AgentMetadata, 'id'>>): Promise<AgentMetadata>;

  /**
   * Agent 생성
   */
  createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata>;

  /**
   * Agent 삭제
   */
  deleteAgent(id: string): Promise<AgentMetadata>;
}
