import { CursorPagination, CursorPaginationResult } from '../../common/pagination/cursor-pagination';
import { ChatSession, CompressStrategy } from '../chat-session';
import { ChatCreateOptions, ChatManager, ChatSessionDescription, ChatLoadOptions } from '../chat.manager';
import { FileBasedSessionStorage } from './file-based-session-storage';
export declare class FileBasedChatManager implements ChatManager {
    private readonly storage;
    private readonly historyCompressor;
    private readonly titleCompressor?;
    constructor(storage: FileBasedSessionStorage, historyCompressor: CompressStrategy, titleCompressor?: CompressStrategy | undefined);
    list(options?: CursorPagination): Promise<CursorPaginationResult<ChatSessionDescription>>;
    create(options?: ChatCreateOptions): Promise<ChatSession>;
    load(options: ChatLoadOptions): Promise<ChatSession>;
}
//# sourceMappingURL=file-based-chat.manager.d.ts.map