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
     * Load a chat session
     * @param options - The options for the chat session
     * @returns The loaded chat session
     */
    load(options: ChatLoadOptions): Promise<ChatSession>;
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
export interface ChatLoadOptions {
    sessionId: string;
}
/**
 * A lightweight summary of a session for listing
 */
export interface ChatSessionDescription {
    id: string;
    title: string;
    updatedAt: Date;
}
//# sourceMappingURL=chat.manager.d.ts.map