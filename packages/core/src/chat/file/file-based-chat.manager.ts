import {
  CursorPagination,
  CursorPaginationResult,
} from '../../common/pagination/cursor-pagination';
import { uuid } from '../../common/utils/uuid';
import { ChatSession, CompressStrategy } from '../chat-session';
import {
  ChatCreateOptions,
  ChatManager,
  ChatSessionDescription,
  ChatLoadOptions,
} from '../chat.manager';

import { FileBasedChatSession } from './file-based-chat-session';
import { FileBasedSessionStorage } from './file-based-session-storage';

export class FileBasedChatManager implements ChatManager {
  constructor(
    private readonly storage: FileBasedSessionStorage,
    private readonly historyCompressor: CompressStrategy,
    private readonly titleCompressor?: CompressStrategy
  ) {}

  async list(options?: CursorPagination): Promise<CursorPaginationResult<ChatSessionDescription>> {
    const sessionList = await this.storage.getSessionList();

    const filtered = sessionList.filter((session) => {
      if (options?.cursor) {
        return session.id > options.cursor;
      }

      return true;
    });

    return {
      items: filtered,
      nextCursor: filtered.at(-1)?.id ?? '',
    };
  }

  async create(options?: ChatCreateOptions): Promise<ChatSession> {
    const sessionId = uuid();

    const metadata = {
      sessionId: sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      preset: options?.preset,
      latestMessageId: 0,
      totalMessages: 0,
      totalUsage: {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
      },
      recentMessages: [],
      latestSummary: undefined,
      latestCheckpoint: undefined,
    };

    return new FileBasedChatSession(
      sessionId,
      this.storage,
      metadata,
      this.historyCompressor,
      this.titleCompressor
    );
  }

  async load(options: ChatLoadOptions): Promise<ChatSession> {
    const metadata = await this.storage.getSessionMetadata(options.sessionId);

    const chatSession = new FileBasedChatSession(
      metadata.sessionId,
      this.storage,
      metadata,
      this.historyCompressor,
      this.titleCompressor
    );

    return chatSession;
  }
}
