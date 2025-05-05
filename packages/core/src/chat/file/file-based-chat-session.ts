import { LlmUsage, Message } from 'llm-bridge-spec';
import {
  CursorPagination,
  CursorPaginationResult,
} from '../../common/pagination/cursor-pagination';
import { Preset } from '../../preset/preset';
import { ChatSession, Checkpoint, CompressStrategy, MessageHistory } from '../chat-session';
import { ChatSessionMetadata } from '../chat-session-metata';
import { uuid } from '../../common/utils/uuid';
import { FileBasedSessionStorage } from './file-based-session-storage';

import { FileBasedSessionMetadata } from './file-based-session.metadata';

export class FileBasedChatSession implements ChatSession {
  constructor(
    public readonly sessionId: string,
    private readonly storage: FileBasedSessionStorage,
    private readonly metadata: FileBasedSessionMetadata
  ) {}

  get preset(): Preset | undefined {
    return this.metadata.preset;
  }

  async save(): Promise<void> {
    this.metadata.updatedAt = new Date();

    await this.storage.saveSessionMetadata(this.sessionId, this.metadata);

    if (this.metadata.recentMessages.length > 0) {
      await this.storage.saveMessageHistories(this.sessionId, this.metadata.recentMessages);
    }
  }

  async sumUsage(usage: LlmUsage): Promise<void> {
    this.metadata.totalUsage.totalTokens += usage.totalTokens;
    this.metadata.totalUsage.promptTokens += usage.promptTokens;
    this.metadata.totalUsage.completionTokens += usage.completionTokens;
  }

  async compress(strategy: CompressStrategy): Promise<void> {
    if (this.metadata.recentMessages.length === 0) {
      return;
    }

    const message = this.metadata.recentMessages[0];

    const compressed = await strategy.compress(this.metadata.recentMessages);

    await this.storage.saveMessageHistories(this.sessionId, this.metadata.recentMessages);

    this.metadata.recentMessages = [];

    this.metadata.latestCheckpoint = {
      checkpointId: uuid(),
      message: {
        messageId: this.nextMessageId(),
        createdAt: new Date(),
        ...compressed,
      },
      createdAt: new Date(),
      upToCreatedAt: message.createdAt,
    };

    await this.storage.saveCheckpoint(this.sessionId, this.metadata.latestCheckpoint);
  }

  private nextMessageId(): string {
    const id = this.metadata.latestMessageId++;
    return id.toString();
  }

  async getMetadata(): Promise<Readonly<ChatSessionMetadata>> {
    return this.metadata;
  }

  /**
   * Append a message to the chat session
   * @param message - The message to append
   */
  async appendMessage(message: Message): Promise<void> {
    this.metadata.recentMessages.push({
      messageId: this.nextMessageId(),
      createdAt: new Date(),
      ...message,
    });

    this.metadata.totalMessages++;
  }

  async getHistories(options?: CursorPagination): Promise<CursorPaginationResult<MessageHistory>> {
    const { cursor, limit = 10 } = options ?? {};

    const buffer: MessageHistory[] = [];

    for await (const history of this.storage.read(this.sessionId)) {
      buffer.push(history);

      if (buffer.length >= limit) {
        break;
      }

      if (cursor && history.messageId < cursor) {
        break;
      }
    }

    return {
      items: buffer,
      nextCursor: buffer[buffer.length - 1].messageId,
    };
  }

  async getCheckpoints(): Promise<CursorPaginationResult<Checkpoint>> {
    const checkpoint = await this.storage.getCheckpoint(this.sessionId);

    return {
      items: checkpoint ? [checkpoint] : [],
      nextCursor: '',
    };
  }
}
