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

/**
 * The file based chat session
 * @TODO recentMessages 저장 시점 및 페이징 처리 로직 추가
 */
export class FileBasedChatSession implements ChatSession {
  constructor(
    public readonly sessionId: string,
    private readonly storage: FileBasedSessionStorage,
    private readonly metadata: FileBasedSessionMetadata,
    private readonly historyCompressor: CompressStrategy,
    private readonly titleCompressor?: CompressStrategy
  ) {}

  get preset(): Preset | undefined {
    return this.metadata.preset;
  }

  set preset(preset: Preset | undefined) {
    this.metadata.preset = preset;
  }

  get title(): string | undefined {
    return this.metadata.title;
  }

  set title(title: string | undefined) {
    this.metadata.title = title;
  }

  async sumUsage(usage: LlmUsage): Promise<void> {
    this.metadata.totalUsage.totalTokens += usage.totalTokens;
    this.metadata.totalUsage.promptTokens += usage.promptTokens;
    this.metadata.totalUsage.completionTokens += usage.completionTokens;
  }

  async commit(): Promise<void> {
    if (this.metadata.recentMessages.length > 0) {
      const first = this.metadata.recentMessages[0];
      const compressed = await this.historyCompressor.compress(this.metadata.recentMessages);

      this.metadata.latestCheckpoint = {
        checkpointId: uuid(),
        message: {
          messageId: this.nextMessageId(),
          createdAt: new Date(),
          ...compressed.summary,
        },
        createdAt: new Date(),
        coveringUpTo: first.createdAt,
      };

      await this.storage.saveCheckpoint(this.sessionId, this.metadata.latestCheckpoint);
      await this.storage.saveMessageHistories(this.sessionId, this.metadata.recentMessages);
      this.metadata.recentMessages = [];
    }

    this.metadata.updatedAt = new Date();

    if (!this.metadata.title && this.titleCompressor) {
      const userMessage = this.metadata.recentMessages.find((message) => message.role === 'user');

      if (userMessage) {
        const { summary } = await this.titleCompressor.compress([userMessage]);

        this.metadata.title =
          summary.content.contentType === 'text' ? summary.content.value : undefined;
      }
    }

    await this.storage.saveSessionMetadata(this.sessionId, this.metadata);
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
      if (cursor && Number(history.messageId) <= Number(cursor)) {
        continue;
      }

      buffer.push(history);

      if (buffer.length >= limit) {
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
