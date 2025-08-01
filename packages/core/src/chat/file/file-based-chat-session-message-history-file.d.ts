import { MessageHistory } from '../chat-session';
export declare class FileBasedChatSessionMessageHistoryFile {
    readonly directoryPath: string;
    private readonly fileName;
    private readonly _fullPath;
    constructor(directoryPath: string);
    get fullPath(): string;
    exists(): Promise<boolean>;
    create(): Promise<void>;
    appendMany(messageHistories: MessageHistory[]): Promise<void>;
    readOrThrow(options?: {
        chunkSize: number;
    }): AsyncGenerator<MessageHistory>;
}
//# sourceMappingURL=file-based-chat-session-message-history-file.d.ts.map