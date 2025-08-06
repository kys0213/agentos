import { ChatMessage, LlmUsage, Message } from 'llm-bridge-spec';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';
import { ChatSessionMetadata } from './chat-session-metata';
import { AgentMetadata } from '../agent/agent-metadata';

/**
 * The chat session
 */
export interface ChatSession {
  /**
   * The id of the chat session
   */
  sessionId: string;

  /**
   * The title of the chat session
   */
  title?: string;

  /**
   * Append a message to the chat session
   * @param message - The message to append
   */
  appendMessage(message: Message): Promise<void>;

  /**
   * Append a usage to the chat session
   * @param usage - The usage to append
   */
  sumUsage(usage: LlmUsage): Promise<void>;

  /**
   * Get the history of the chat session
   * @param options - The options for the history
   * @returns The history of the chat session
   */
  getHistories(
    options?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>>;

  /**
   * Get the checkpoint of the chat session
   * @returns The checkpoint of the chat session
   */
  getCheckpoints(options?: CursorPagination): Promise<CursorPaginationResult<Readonly<Checkpoint>>>;

  /**
   * Get the metadata of the chat session
   * @returns The metadata of the chat session
   */
  getMetadata(): Promise<Readonly<ChatSessionMetadata>>;

  /**
   * Commit the chat session
   */
  commit(): Promise<void>;
}

/**
 * The checkpoint of the chat session
 */
export interface Checkpoint {
  /**
   * The id of the checkpoint
   */
  checkpointId: string;

  /**
   * The message of the checkpoint
   */
  message: MessageHistory;

  /**
   * The created at of the checkpoint
   */
  createdAt: Date;

  /**
   * The up to created at of the checkpoint
   */
  coveringUpTo: Date;
}

/**
 * The message history of the chat session
 */
export type MessageHistory = Message & {
  messageId: string;
  createdAt: Date;
  isCompressed?: boolean;
  agentMetadata?: AgentMetadata;
};

/**
 * The strategy to compress the chat session
 */
export interface CompressStrategy {
  /**
   * Compress the chat session
   * @param messages - The messages to compress
   * @returns The compressed messages
   */
  compress(messages: MessageHistory[]): Promise<CompressionResult>;
}

/**
 * The result of the compression
 */
export interface CompressionResult {
  summary: ChatMessage;
  compressedCount: number;
  discardedMessages?: string[];
}
