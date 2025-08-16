import { CursorPaginationResult } from '../../common/pagination/cursor-pagination';
import { uuid } from '../../common/utils/uuid';
import { ChatSession, CompressStrategy } from '../chat-session';
import {
  ChatBaseOptions,
  ChatCreateOptions,
  ChatListOption,
  ChatManager,
  ChatSessionDescription,
} from '../chat.manager';

import { FileBasedChatSession } from './file-based-chat-session';
import { FileBasedSessionStorage } from './file-based-session-storage';
import { FileBasedSessionMetadata } from './file-based-session.metadata';

export class FileBasedChatManager implements ChatManager {
  private readonly sessionCache = new Map<string, ChatSession>();
  private readonly sessionActivity = new Map<string, Date>();
  private readonly maxCachedSessions: number;

  constructor(
    private readonly storage: FileBasedSessionStorage,
    private readonly historyCompressor: CompressStrategy,
    private readonly titleCompressor?: CompressStrategy,
    options?: {
      maxCachedSessions?: number;
    }
  ) {
    this.maxCachedSessions = options?.maxCachedSessions || 50;
  }

  async list(options: ChatListOption): Promise<CursorPaginationResult<ChatSessionDescription>> {
    const sessionList = await this.storage.getSessionList(options.agentId);

    const filtered = sessionList.filter((session) => {
      if (options.pagination?.cursor) {
        return session.id > options.pagination.cursor;
      }

      return true;
    });

    return {
      items: filtered,
      nextCursor: filtered.at(-1)?.id ?? '',
      hasMore: false,
    };
  }

  async create(options: ChatCreateOptions): Promise<ChatSession> {
    const sessionId = options.sessionId || uuid();
    const agentId = options.agentId;

    const metadata: FileBasedSessionMetadata = {
      sessionId: sessionId,
      agentId,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      joinedAgents: [],
    };

    return new FileBasedChatSession(
      sessionId,
      this.storage,
      metadata,
      this.historyCompressor,
      this.titleCompressor
    );
  }

  async load(options: ChatBaseOptions): Promise<ChatSession> {
    const metadata = await this.storage.getSessionMetadata(options.agentId, options.sessionId);

    const chatSession = new FileBasedChatSession(
      metadata.sessionId,
      this.storage,
      metadata,
      this.historyCompressor,
      this.titleCompressor
    );

    return chatSession;
  }

  async getSession(option: ChatBaseOptions): Promise<ChatSession> {
    // 캐시에 있으면 활동 시간 업데이트하고 반환
    if (this.sessionCache.has(option.sessionId)) {
      this.sessionActivity.set(option.sessionId, new Date());
      return this.sessionCache.get(option.sessionId)!;
    }

    // 스토리지에서 기존 세션 로드 시도
    try {
      const session = await this.load(option);
      // 캐시에 추가
      await this.addToCache(option.sessionId, session);
      return session;
    } catch (error) {
      // 세션이 없으면 새로 생성
      const session = await this.create({ sessionId: option.sessionId, agentId: option.agentId });
      await this.addToCache(option.sessionId, session);
      return session;
    }
  }

  async hasSession(option: ChatBaseOptions): Promise<boolean> {
    // 캐시에 있으면 true
    if (this.sessionCache.has(option.sessionId)) {
      return true;
    }

    // 스토리지에서 확인
    try {
      await this.storage.getSessionMetadata(option.agentId, option.sessionId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeSession(option: ChatBaseOptions): Promise<void> {
    const session = this.sessionCache.get(option.sessionId);
    if (session) {
      // 세션 정리 (커밋 등)
      try {
        await session.commit();
      } catch (error) {
        console.warn(`Failed to commit session ${option.sessionId}:`, error);
      }

      // 캐시에서 제거
      this.sessionCache.delete(option.sessionId);
      this.sessionActivity.delete(option.sessionId);
    }
  }

  async getActiveSessions(): Promise<string[]> {
    return Array.from(this.sessionCache.keys());
  }

  async clearSessionCache(): Promise<void> {
    // 모든 세션 커밋 및 정리
    for (const [sessionId, session] of this.sessionCache.entries()) {
      await this.removeSession({ sessionId, agentId: session.agentId });
    }
  }

  private async addToCache(sessionId: string, session: ChatSession): Promise<void> {
    // 최대 캐시 크기 체크
    if (this.sessionCache.size >= this.maxCachedSessions) {
      await this.evictOldestSession();
    }

    // 캐시에 추가
    this.sessionCache.set(sessionId, session);
    this.sessionActivity.set(sessionId, new Date());
  }

  private async evictOldestSession(): Promise<void> {
    let oldestSessionId = '';
    let oldestTime = new Date();

    // 가장 오래된 세션 찾기
    for (const [sessionId, lastActivity] of this.sessionActivity) {
      if (lastActivity < oldestTime) {
        oldestTime = lastActivity;
        oldestSessionId = sessionId;
      }
    }

    // 가장 오래된 세션 제거
    if (oldestSessionId && this.sessionCache.has(oldestSessionId)) {
      const agentId = this.sessionCache.get(oldestSessionId)!.agentId;

      await this.removeSession({ sessionId: oldestSessionId, agentId: agentId });
    }
  }
}
