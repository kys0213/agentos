import path from 'path';
import { MessageHistory } from '../chat-session';
import { fs } from '@agentos/lang';

export class FileBasedChatSessionMessageHistoryFile {
  private readonly fileName = 'histories.jsonl';
  private readonly _fullPath: string;
  private readonly jsonlHandler: fs.JsonLFileHandler<MessageHistory>;

  constructor(public readonly directoryPath: string) {
    this._fullPath = path.join(directoryPath, this.fileName);
    this.jsonlHandler = fs.JsonLFileHandler.create<MessageHistory>(this._fullPath);
  }

  get fullPath(): string {
    return this._fullPath;
  }

  async exists(): Promise<boolean> {
    return this.jsonlHandler.exists();
  }

  async create(): Promise<void> {
    const result = await fs.FileUtils.writeSafe(this.fullPath, '');
    if (!result.success) {
      throw new Error(`Failed to create history file: ${String(result.reason)}`);
    }
  }

  async appendMany(messageHistories: MessageHistory[]): Promise<void> {
    const result = await this.jsonlHandler.appendMany(messageHistories);
    if (!result.success) {
      throw new Error(`Failed to append histories: ${String(result.reason)}`);
    }
  }

  async *readOrThrow(options?: { chunkSize: number }): AsyncGenerator<MessageHistory> {
    if (!(await this.exists())) {
      throw new Error(`Message history file not found: ${this.fullPath}`);
    }

    const { chunkSize = 5 } = options ?? {};
    const buffer: MessageHistory[] = [];

    for await (const result of this.jsonlHandler.readStream({ 
      chunkSize, 
      skipEmptyLines: true, 
      skipInvalidJson: false 
    })) {
      if (!result.success) {
        throw new Error(`Failed to read message history: ${String(result.reason)}`);
      }

      // 날짜 필드 변환
      const messageHistory: MessageHistory = {
        ...result.result,
        createdAt: new Date(result.result.createdAt),
      };

      buffer.push(messageHistory);

      if (buffer.length >= chunkSize) {
        yield* buffer;
        buffer.length = 0;
      }
    }

    if (buffer.length > 0) {
      yield* buffer;
    }
  }
}
