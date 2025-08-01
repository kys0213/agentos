import { LlmUsage, Message } from 'llm-bridge-spec';
import { CursorPagination, CursorPaginationResult } from '../../common/pagination/cursor-pagination';
import { Preset } from '../../preset/preset';
import { ChatSession, Checkpoint, CompressStrategy, MessageHistory } from '../chat-session';
import { ChatSessionMetadata } from '../chat-session-metata';
import { FileBasedSessionStorage } from './file-based-session-storage';
import { FileBasedSessionMetadata } from './file-based-session.metadata';
/**
 * The file based chat session
 * @TODO recentMessages 저장 시점 및 페이징 처리 로직 추가
 */
export declare class FileBasedChatSession implements ChatSession {
    readonly sessionId: string;
    private readonly storage;
    private readonly metadata;
    private readonly historyCompressor;
    private readonly titleCompressor?;
    constructor(sessionId: string, storage: FileBasedSessionStorage, metadata: FileBasedSessionMetadata, historyCompressor: CompressStrategy, titleCompressor?: CompressStrategy | undefined);
    get preset(): Preset | undefined;
    set preset(preset: Preset | undefined);
    get title(): string | undefined;
    set title(title: string | undefined);
    sumUsage(usage: LlmUsage): Promise<void>;
    commit(): Promise<void>;
    private nextMessageId;
    getMetadata(): Promise<Readonly<ChatSessionMetadata>>;
    /**
     * Append a message to the chat session
     * @param message - The message to append
     */
    appendMessage(message: Message): Promise<void>;
    getHistories(options?: CursorPagination): Promise<CursorPaginationResult<MessageHistory>>;
    getCheckpoints(): Promise<CursorPaginationResult<Checkpoint>>;
}
//# sourceMappingURL=file-based-chat-session.d.ts.map