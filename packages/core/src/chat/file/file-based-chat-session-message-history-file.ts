import fs from 'fs/promises';
import path from 'path';
import { MessageHistory } from '../chat-session';
import { parseJson } from '../../common/utils/parseJson';
import readline from 'readline';

export class FileBasedChatSessionMessageHistoryFile {
  private readonly fileName = 'histories.jsonl';
  private readonly _fullPath: string;

  constructor(public readonly directoryPath: string) {
    this._fullPath = path.join(directoryPath, this.fileName);
  }

  get fullPath(): string {
    return this._fullPath;
  }

  async exists(): Promise<boolean> {
    return fs
      .access(this.fullPath)
      .then(() => true)
      .catch(() => false);
  }

  async create(): Promise<void> {
    await fs.writeFile(this.fullPath, '');
  }

  async appendMany(messageHistories: MessageHistory[]): Promise<void> {
    if (!(await this.exists())) {
      await this.create();
    }

    const file = await fs.open(this.fullPath, 'a');

    try {
      const lines = messageHistories.map((m) => JSON.stringify(m)).join('\n') + '\n';
      await file.write(lines);
    } finally {
      await file.close();
    }
  }

  async *readOrThrow(options?: { chunkSize: number }): AsyncGenerator<MessageHistory> {
    if (!(await this.exists())) {
      throw new Error(`Message history file not found: ${this.fullPath}`);
    }

    const { chunkSize = 5 } = options ?? {};

    const file = await fs.open(this.fullPath, 'r');

    try {
      const rl = readline.createInterface({
        input: file.createReadStream(),
        crlfDelay: Infinity,
      });

      const buffer: MessageHistory[] = [];

      for await (const line of rl) {
        const messageHistory = parseJson<MessageHistory>(line);

        buffer.push({
          ...messageHistory,
          createdAt: new Date(messageHistory.createdAt),
        });

        if (buffer.length >= chunkSize) {
          yield* buffer;
          buffer.length = 0;
        }
      }

      if (buffer.length > 0) {
        yield* buffer;
      }
    } finally {
      await file.close();
    }
  }
}
