import { Checkpoint, MessageHistory } from '../chat-session';
import { ChatSessionDescription } from '../chat.manager';
import { FileBasedSessionMetadata } from './file-based-session.metadata';
export declare class FileBasedSessionStorage {
    private readonly baseDir;
    private readonly dirNameCache;
    constructor(baseDir: string);
    saveMessageHistories(sessionId: string, messageHistories: MessageHistory[]): Promise<void>;
    readAll(sessionId: string): Promise<MessageHistory[]>;
    read(sessionId: string): AsyncGenerator<MessageHistory>;
    saveCheckpoint(sessionId: string, checkpoint: Checkpoint): Promise<void>;
    saveSessionMetadata(sessionId: string, metadata: FileBasedSessionMetadata): Promise<void>;
    getCheckpoint(sessionId: string): Promise<Checkpoint | undefined>;
    getCheckpointOrThrow(sessionId: string): Promise<Checkpoint>;
    getSessionMetadata(sessionId: string): Promise<FileBasedSessionMetadata>;
    /**
     * 세션 디렉토리 목록을 조회하여 ChatSessionDescription 리스트 반환
     */
    getSessionList(): Promise<ChatSessionDescription[]>;
    /**
     * 특정 세션의 메타 정보 로딩
     */
    getSessionDescription(sessionId: string): Promise<ChatSessionDescription | null>;
    private resolveSessionDir;
    private existsDirectory;
}
//# sourceMappingURL=file-based-session-storage.d.ts.map