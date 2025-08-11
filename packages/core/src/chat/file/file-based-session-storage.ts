import fs from 'fs/promises';
import path from 'path';
import { Checkpoint, MessageHistory } from '../chat-session';
import { ChatSessionDescription } from '../chat.manager';
import { FileBasedChatSessionCheckpointFile } from './file-based-chat-session-check-point-file';
import { FileBasedChatSessionMessageHistoryFile } from './file-based-chat-session-message-history-file';
import { FileBasedChatSessionMetadataFile } from './file-based-chat-session-metadata-file';
import { FileBasedSessionMetadata } from './file-based-session.metadata';
import { validation } from '@agentos/lang';

const { isNonEmptyArray, isPlainObject } = validation;

export class FileBasedSessionStorage {
  // TODO LRU Cache 적용
  private readonly dirNameCache: Map<string, ChatSessionFiles> = new Map();

  constructor(private readonly baseDir: string) {}

  async saveMessageHistories(sessionId: string, messageHistories: MessageHistory[]): Promise<void> {
    const { messageHistory: messageHistoryFile } = await this.resolveSessionDir(sessionId);

    await messageHistoryFile.appendMany(messageHistories);
  }

  async readAll(sessionId: string): Promise<MessageHistory[]> {
    const messageHistories: MessageHistory[] = [];

    for await (const messageHistory of this.read(sessionId)) {
      messageHistories.push(messageHistory);
    }

    return messageHistories;
  }

  async *read(sessionId: string): AsyncGenerator<MessageHistory> {
    const files = await this.resolveSessionDir(sessionId);

    if (!files) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const messageHistoryFile = files.messageHistory;

    for await (const messageHistory of messageHistoryFile.readOrThrow()) {
      yield messageHistory;
    }
  }

  async saveCheckpoint(sessionId: string, checkpoint: Checkpoint): Promise<void> {
    const { checkpoint: checkpointFile } = await this.resolveSessionDir(sessionId);

    await checkpointFile.update(checkpoint);
  }

  async saveSessionMetadata(sessionId: string, metadata: FileBasedSessionMetadata): Promise<void> {
    const { metadata: metaFile } = await this.resolveSessionDir(sessionId);

    await metaFile.update(metadata);
  }

  async getCheckpoint(sessionId: string): Promise<Checkpoint | undefined> {
    const { checkpoint } = await this.resolveSessionDir(sessionId);

    const data = await checkpoint.read();

    if (!data) {
      return;
    }

    return {
      ...data,
      message: {
        ...data.message,
        createdAt: new Date(data.message.createdAt),
      },
      createdAt: new Date(data.createdAt),
      coveringUpTo: new Date(data.coveringUpTo),
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
    const { metadata } = await this.resolveSessionDir(sessionId);

    const meta = await metadata.read();

    return {
      ...meta,
      latestSummary: meta.latestSummary
        ? {
            ...meta.latestSummary,
            createdAt: new Date(meta.latestSummary.createdAt),
          }
        : undefined,
      recentMessages: isNonEmptyArray(meta.recentMessages) 
        ? meta.recentMessages.map((message) => ({
            ...message,
            createdAt: new Date(message.createdAt),
          }))
        : [],
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

      const cached = this.dirNameCache.get(entry.name);

      const metadataFile = cached
        ? cached.metadata
        : new FileBasedChatSessionMetadataFile(fullPath);

      const meta = await metadataFile.read();

      sessionList.push({ id: entry.name, title: meta.title ?? '', updatedAt: meta.updatedAt });
    }

    return sessionList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * 특정 세션의 메타 정보 로딩
   */
  async getSessionDescription(sessionId: string): Promise<ChatSessionDescription | null> {
    const files = await this.resolveSessionDir(sessionId);

    if (!files) {
      return null;
    }

    const meta = await files.metadata.read();

    return {
      id: meta.sessionId,
      title: meta.title ?? '',
      updatedAt: new Date(meta.updatedAt),
    };
  }

  private async resolveSessionDir(sessionId: string): Promise<ChatSessionFiles> {
    const cached = this.dirNameCache.get(sessionId);

    if (cached) {
      return cached;
    }

    const directoryPath = path.join(this.baseDir, sessionId);
    const metaFile = new FileBasedChatSessionMetadataFile(directoryPath);
    const messageHistoryFile = new FileBasedChatSessionMessageHistoryFile(directoryPath);
    const checkpointFile = new FileBasedChatSessionCheckpointFile(directoryPath);

    if (!(await this.existsDirectory(directoryPath))) {
      await fs.mkdir(directoryPath, { recursive: true });
      await metaFile.create();
      await messageHistoryFile.create();
      await checkpointFile.create();
    }

    const files: ChatSessionFiles = {
      metadata: metaFile,
      messageHistory: messageHistoryFile,
      checkpoint: checkpointFile,
    };

    this.dirNameCache.set(sessionId, files);

    return files;
  }

  private async existsDirectory(directoryPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(directoryPath);
      return stat.isDirectory();
    } catch (error) {
      return false;
    }
  }
}

interface ChatSessionFiles {
  metadata: FileBasedChatSessionMetadataFile;
  messageHistory: FileBasedChatSessionMessageHistoryFile;
  checkpoint: FileBasedChatSessionCheckpointFile;
}
