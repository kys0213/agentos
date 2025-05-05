import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { parseJson } from '../../common/utils/parseJson';
import { Checkpoint, MessageHistory } from '../chat-session';
import { ChatSessionDescription } from '../chat.manager';
import { FileBasedSessionMetadata } from './file-based-session.metadata';

export class FileBasedSessionStorage {
  private readonly dirNameCache: Map<string, string> = new Map();

  constructor(private readonly baseDir: string) {}

  async saveMessageHistories(sessionId: string, messageHistories: MessageHistory[]): Promise<void> {
    const dirName = await this.resolveSessionDir(sessionId);

    if (!dirName) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const fullPath = path.join(this.baseDir, dirName, 'histories.jsonl');

    if (!(await this.existsFile(fullPath))) {
      await fs.writeFile(fullPath, '');
    }

    const file = await fs.open(fullPath, 'a');

    try {
      for (const messageHistory of messageHistories) {
        await file.writeFile(JSON.stringify(messageHistory));
        await file.writeFile('\n');
      }
    } finally {
      await file.close();
    }
  }

  async readAll(sessionId: string): Promise<MessageHistory[]> {
    const messageHistories: MessageHistory[] = [];

    for await (const messageHistory of this.read(sessionId)) {
      messageHistories.push(messageHistory);
    }

    return messageHistories;
  }

  async *read(sessionId: string): AsyncGenerator<MessageHistory> {
    const dirName = await this.resolveSessionDir(sessionId);

    if (!dirName) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const fullPath = path.join(this.baseDir, dirName, 'histories.jsonl');

    const file = await fs.open(fullPath, 'r');

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

        if (buffer.length > 5) {
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

  async saveCheckpoint(sessionId: string, checkpoint: Checkpoint): Promise<void> {
    const dirName = await this.resolveSessionDir(sessionId);

    if (!dirName) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const checkpointRaw = JSON.stringify(checkpoint);

    await fs.writeFile(path.join(this.baseDir, dirName, 'checkpoint.json'), checkpointRaw);
  }

  async saveSessionMetadata(sessionId: string, metadata: FileBasedSessionMetadata): Promise<void> {
    const metadataRaw = JSON.stringify(metadata);

    const directoryPath = path.join(this.baseDir, `${sessionId}-${metadata.title}`);

    if (!(await this.existsDirectory(directoryPath))) {
      await fs.mkdir(directoryPath, { recursive: true });
    }

    await fs.writeFile(path.join(directoryPath, 'meta.json'), metadataRaw);
  }

  async getCheckpoint(sessionId: string): Promise<Checkpoint | undefined> {
    const dirName = await this.resolveSessionDir(sessionId);

    if (!dirName) {
      return;
    }

    const checkpointRaw = await this.readJsonFile(dirName, 'checkpoint.json');

    const checkpoint = parseJson<Checkpoint>(checkpointRaw);

    return {
      ...checkpoint,
      message: {
        ...checkpoint.message,
        createdAt: new Date(checkpoint.message.createdAt),
      },
      createdAt: new Date(checkpoint.createdAt),
      upToCreatedAt: new Date(checkpoint.upToCreatedAt),
    };
  }

  async getCheckpointOrThrow(sessionId: string): Promise<Checkpoint> {
    const checkpoint = await this.getCheckpoint(sessionId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${sessionId}`);
    }

    return checkpoint;
  }

  async getSessionMetadata(sessionId: string): Promise<FileBasedSessionMetadata> {
    const dirName = await this.resolveSessionDir(sessionId);

    if (!dirName) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const metaRaw = await this.readJsonFile(dirName, 'meta.json');

    const meta = parseJson<FileBasedSessionMetadata>(metaRaw);

    return {
      ...meta,
      latestSummary: meta.latestSummary
        ? {
            ...meta.latestSummary,
            createdAt: new Date(meta.latestSummary.createdAt),
          }
        : undefined,
      recentMessages: meta.recentMessages.map((message) => ({
        ...message,
        createdAt: new Date(message.createdAt),
      })),
      updatedAt: new Date(meta.updatedAt),
      createdAt: new Date(meta.createdAt),
    };
  }

  /**
   * 세션 디렉토리 목록을 조회하여 ChatSessionDescription 리스트 반환
   */
  async getSessionList(): Promise<ChatSessionDescription[]> {
    const entries = await fs.readdir(this.baseDir, { withFileTypes: true });

    const sessionEntries = entries.filter((entry) => entry.isDirectory());

    const sessionList: ChatSessionDescription[] = [];

    for (const entry of sessionEntries) {
      const fullPath = path.join(this.baseDir, entry.name);

      const { id, title } = this.parseDirectoryName(entry.name);

      const stat = await fs.stat(fullPath);

      sessionList.push({
        id,
        title,
        updatedAt: stat.atime,
      });
    }

    return sessionList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * 특정 세션의 메타 정보 로딩
   */
  async getSessionDescription(sessionId: string): Promise<ChatSessionDescription | null> {
    const dirName = await this.resolveSessionDir(sessionId);

    if (!dirName) {
      return null;
    }

    const metaPath = path.join(this.baseDir, dirName, 'meta.json');
    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw);

    return {
      id: meta.sessionId,
      title: meta.title,
      updatedAt: new Date(meta.updatedAt),
    };
  }

  /**
   * 세션 ID로 디렉토리명 추정 (slug title 포함된 폴더 이름에서 sessionId로 매칭)
   */
  private async resolveSessionDir(sessionId: string): Promise<string | null> {
    const cached = this.dirNameCache.get(sessionId);

    if (cached) {
      return cached;
    }

    const entries = await fs.readdir(this.baseDir);
    const match = entries.find((dir) => dir.startsWith(sessionId));

    if (match) {
      this.dirNameCache.set(sessionId, match);
    }

    return match ?? null;
  }

  private parseDirectoryName(dirName: string): Pick<ChatSessionDescription, 'id' | 'title'> {
    const index = dirName.indexOf('-');

    if (index === -1) {
      throw new Error(`Invalid session directory name: ${dirName}`);
    }

    const id = dirName.slice(0, index);

    const title = dirName.slice(index + 1);

    return {
      id,
      title,
    };
  }

  private async readJsonFile(dirName: string, fileName: string) {
    const fullPath = path.join(this.baseDir, dirName);
    const filePath = path.join(fullPath, fileName);
    const fileRaw = await fs.readFile(filePath, 'utf-8');
    return fileRaw;
  }

  private async existsDirectory(dirName: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirName);
      return stat.isDirectory();
    } catch (error) {
      return false;
    }
  }

  private async existsFile(fileName: string): Promise<boolean> {
    try {
      const stat = await fs.stat(fileName);
      return stat.isFile();
    } catch (error) {
      return false;
    }
  }
}
