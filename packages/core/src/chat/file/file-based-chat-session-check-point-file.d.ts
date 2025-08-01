import { Checkpoint } from '../chat-session';
export declare class FileBasedChatSessionCheckpointFile {
    private readonly fileName;
    private readonly _fullPath;
    constructor(directoryPath: string);
    get fullPath(): string;
    exists(): Promise<boolean>;
    create(): Promise<void>;
    read(): Promise<Checkpoint | undefined>;
    readOrThrow(): Promise<Checkpoint>;
    update(checkpoint: Checkpoint): Promise<void>;
}
//# sourceMappingURL=file-based-chat-session-check-point-file.d.ts.map