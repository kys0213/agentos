import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { ChatContract as C } from '../../shared/rpc/contracts/chat.contract';
import {
  FileBasedChatManager,
  FileBasedSessionStorage,
  CursorPagination,
  CompressStrategy,
  CompressionResult,
  MessageHistory,
} from '@agentos/core';
import path from 'path';
import { app } from 'electron';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly chatManager: FileBasedChatManager;

  constructor() {
    // 사용자 데이터 디렉토리에 chat 저장
    const baseDir = path.join(app.getPath('userData'), 'sessions');
    const storage = new FileBasedSessionStorage(baseDir);

    // 임시 압축 전략 - 추후 실제 LLM 기반 압축으로 교체
    const compressStrategy: CompressStrategy = {
      async compress(messages: MessageHistory[]): Promise<CompressionResult> {
        if (messages.length === 0) {
          throw new Error('No messages to compress');
        }
        return {
          summary: {
            role: 'assistant',
            content: [
              {
                contentType: 'text',
                value: `Summary of ${messages.length} messages`,
              },
            ],
          },
          compressedCount: messages.length,
          discardedMessages: messages.map((m) => m.messageId),
        };
      },
    };

    this.chatManager = new FileBasedChatManager(storage, compressStrategy, compressStrategy, {
      maxCachedSessions: 100,
    });

    this.logger.log(`Chat service initialized with baseDir: ${baseDir}`);
  }

  async listSessions(
    payload: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['listSessions']['response']>> {
    try {
      const { agentId, pagination } = payload;

      const options: CursorPagination | undefined = pagination
        ? {
            cursor: pagination.cursor || '',
            limit: pagination.limit || 20,
            direction: pagination.direction || 'forward',
          }
        : undefined;

      // chatManager의 list 메서드 사용
      // TODO: Core의 ChatListOption 타입이 sessionId를 필수로 요구하지만 실제로는 사용하지 않음
      const result = await this.chatManager.list({
        sessionId: '', // list에서는 사용되지 않음
        agentId,
        pagination: options,
      });

      return {
        items: result.items.map((session) => ({
          id: session.id,
          title: session.title || 'Untitled Session',
          updatedAt: session.updatedAt,
        })),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to list sessions:', error);
      throw error;
    }
  }

  async getMessages(
    params: z.input<(typeof C.methods)['getMessages']['payload']>
  ): Promise<z.output<(typeof C.methods)['getMessages']['response']>> {
    try {
      const { agentId, sessionId, pagination } = params;

      // 세션 로드 또는 생성
      const session = await this.chatManager.getSession({
        sessionId,
        agentId,
      });

      const options: CursorPagination | undefined = pagination
        ? {
            cursor: pagination.cursor || '',
            limit: pagination.limit || 20,
            direction: pagination.direction || 'forward',
          }
        : undefined;

      const result = await session.getHistories(options);

      return {
        items: result.items.map((message) => ({
          messageId: message.messageId,
          createdAt: message.createdAt,
          role: message.role,
          content: message.content,
        })),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    } catch (error) {
      this.logger.error(`Failed to get messages for session ${params.sessionId}:`, error);
      throw error;
    }
  }

  async deleteSession(
    payload: z.input<(typeof C.methods)['deleteSession']['payload']>
  ): Promise<z.output<(typeof C.methods)['deleteSession']['response']>> {
    const { agentId, sessionId } = payload;
    try {
      await this.chatManager.removeSession({
        sessionId,
        agentId,
      });

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * AgentService와 연동을 위한 메서드
   */
  async createSessionForAgent(agentId: string, sessionId?: string): Promise<string> {
    const session = await this.chatManager.create({
      agentId,
      sessionId,
    });

    return session.sessionId;
  }

  /**
   * 메시지 추가를 위한 내부 API
   */
  async appendMessageToSession(
    sessionId: string,
    agentId: string,
    message: MessageHistory
  ): Promise<void> {
    const session = await this.chatManager.getSession({
      sessionId,
      agentId,
    });

    await session.appendMessage(message);
    await session.commit();
  }
}
