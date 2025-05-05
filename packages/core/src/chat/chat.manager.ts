import { Preset } from '../preset/preset';
import { ChatSession } from './chat-session';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';

/**
 * Chat manager
 * @description The chat manager is responsible for creating, using and listing chat sessions
 */
export interface ChatManager {
  /**
   * Create a new chat session
   * @param options - The options for the chat session
   * @returns The created chat session
   */
  create(options?: ChatCreateOptions): Promise<ChatSession>;

  /**
   * Use a chat session
   * @param options - The options for the chat session
   * @returns The used chat session
   */
  use(options: ChatUseOptions): Promise<ChatSession>;

  /**
   * List all chat sessions
   * @param options - The options for the chat session
   * @returns The list of chat sessions
   */
  list(options?: CursorPagination): Promise<CursorPaginationResult<ChatSessionDescription>>;
}

export interface ChatCreateOptions {
  preset?: Preset;
}

export interface ChatUseOptions {
  sessionId: string;
}

export interface ChatSessionDescription {
  id: string;
  title: string;
  updatedAt: Date;
}
