import { ChatSession } from './chat-session';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';

/**
 * Chat manager
 * @description The chat manager is responsible for creating, using and listing chat sessions.
 * Also provides session caching and management capabilities for multi-session scenarios.
 */
export interface ChatManager {
  /**
   * Create a new chat session
   * @param options - The options for the chat session
   * @returns The created chat session
   */
  create(options: Omit<ChatCreateOptions, 'sessionId'>): Promise<ChatSession>;

  /**
   * Load a chat session
   * @param options - The options for the chat session
   * @returns The loaded chat session
   */
  load(options: ChatBaseOptions): Promise<ChatSession>;

  /**
   * List all chat sessions
   * @param options - The options for the chat session
   * @returns The list of chat sessions
   */
  list(options: ChatListOption): Promise<CursorPaginationResult<ChatSessionDescription>>;

  /**
   * Get a session by ID. Creates new session if not exists, or returns cached session if available.
   * This method provides session caching for better performance.
   *
   * @param sessionId - The session ID
   * @param preset - Optional preset to use for new sessions
   * @returns The chat session (cached or newly created)
   */
  getSession(option: ChatBaseOptions): Promise<ChatSession>;

  /**
   * Check if a session exists (in cache or storage)
   *
   * @param sessionId - The session ID
   * @returns Whether the session exists
   */
  hasSession(option: ChatBaseOptions): Promise<boolean>;

  /**
   * Remove a session from cache
   *
   * @param sessionId - The session ID to remove
   */
  removeSession(option: ChatBaseOptions): Promise<void>;

  /**
   * Get all active (cached) session IDs
   *
   * @returns Array of active session IDs
   */
  getActiveSessions(): Promise<string[]>;

  /**
   * Clear all cached sessions
   */
  clearSessionCache(): Promise<void>;
}

export interface ChatCreateOptions {
  sessionId?: string;
  agentId: string;
}

export interface ChatBaseOptions {
  sessionId: string;
  agentId: string;
}

/**
 * A lightweight summary of a session for listing
 */
export interface ChatSessionDescription {
  id: string;
  title: string;
  updatedAt: Date;
}

export type ChatListOption = ChatBaseOptions & {
  pagination?: CursorPagination;
};
