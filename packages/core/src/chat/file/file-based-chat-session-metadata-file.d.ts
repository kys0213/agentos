import { FileBasedSessionMetadata } from './file-based-session.metadata';
export declare class FileBasedChatSessionMetadataFile {
    private readonly fileName;
    private readonly _fullPath;
    constructor(directoryPath: string);
    get fullPath(): string;
    exists(): Promise<boolean>;
    create(): Promise<void>;
    read(): Promise<FileBasedSessionMetadata>;
    update(metadata: FileBasedSessionMetadata): Promise<void>;
}
//# sourceMappingURL=file-based-chat-session-metadata-file.d.ts.map