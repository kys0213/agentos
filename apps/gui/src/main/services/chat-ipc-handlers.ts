import { ipcMain, IpcMainInvokeEvent, app } from 'electron';
import {
  ChatManager,
  FileBasedChatManager,
  FileBasedSessionStorage,
  CursorPagination,
  CursorPaginationResult,
  ChatSessionDescription,
  MessageHistory,
} from '@agentos/core';
import * as path from 'path';
import { NoopCompressor } from '../NoopCompressor';
import fs from 'fs/promises';

let chatManager: ChatManager | null = null;
let sessionsBasePath: string | null = null;

function initializeChatManager(): ChatManager {
  if (chatManager) return chatManager;

  const userDataPath = app.getPath('userData');
  const sessionsPath = path.join(userDataPath, 'sessions');
  sessionsBasePath = sessionsPath;

  const sessionStorage = new FileBasedSessionStorage(sessionsPath);
  const historyCompressor = new NoopCompressor();
  const titleCompressor = new NoopCompressor();

  chatManager = new FileBasedChatManager(sessionStorage, historyCompressor, titleCompressor);

  console.log('Chat manager initialized');
  return chatManager;
}

export function setupChatIpcHandlers() {
  const manager = initializeChatManager();

  // IpcChannel 인터페이스에 맞춘 Chat 핸들러들

  // createChatSession
  ipcMain.handle(
    'chat:create-session',
    async (_event: IpcMainInvokeEvent, options?: { preset?: any }) => {
      try {
        const session = await manager.create(options || {});
        return session;
      } catch (error) {
        console.error('Failed to create chat session:', error);
        throw error;
      }
    }
  );

  // listChatSessions
  ipcMain.handle(
    'chat:list-sessions',
    async (_event: IpcMainInvokeEvent, pagination?: CursorPagination) => {
      try {
        const result = await manager.list(pagination);
        return result as CursorPaginationResult<ChatSessionDescription>;
      } catch (error) {
        console.error('Failed to list chat sessions:', error);
        throw error;
      }
    }
  );

  // loadChatSession
  ipcMain.handle('chat:load-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      const session = await manager.load({ sessionId });
      return session;
    } catch (error) {
      console.error('Failed to load chat session:', error);
      throw error;
    }
  });

  // sendChatMessage
  ipcMain.handle(
    'chat:send-message',
    async (_event: IpcMainInvokeEvent, sessionId: string, message: string) => {
      try {
        // TODO: 실제 메시지 전송 구현 필요
        // 지금은 임시 구현
        const messageId = Math.random().toString(36).substr(2, 9);
        return {
          success: true,
          messageId,
          error: undefined,
        };
      } catch (error) {
        console.error('Failed to send message:', error);
        return {
          success: false,
          messageId: undefined,
          error: (error as Error).message,
        };
      }
    }
  );

  // streamChatMessage
  ipcMain.handle(
    'chat:stream-message',
    async (_event: IpcMainInvokeEvent, sessionId: string, message: string) => {
      try {
        // TODO: 스트리밍 메시지 구현 필요
        // 지금은 임시 구현 - ReadableStream을 IPC로 전달하기 위한 추가 작업 필요
        console.log(`Streaming message for session ${sessionId}: ${message}`);
        return new ReadableStream({
          start(controller) {
            controller.enqueue(`Response to: ${message}`);
            controller.close();
          },
        });
      } catch (error) {
        console.error('Failed to stream message:', error);
        throw error;
      }
    }
  );

  // getChatMessages
  ipcMain.handle(
    'chat:get-messages',
    async (
      _event: IpcMainInvokeEvent,
      sessionId: string,
      pagination?: CursorPagination
    ): Promise<CursorPaginationResult<Readonly<MessageHistory>>> => {
      try {
        const session = await manager.getSession(sessionId);
        const histories = await session.getHistories(pagination);
        return histories as CursorPaginationResult<Readonly<MessageHistory>>;
      } catch (error) {
        console.error('Failed to get chat messages:', error);
        throw error;
      }
    }
  );

  // deleteChatSession
  ipcMain.handle('chat:delete-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      // Ensure cache is cleared/committed
      await manager.removeSession(sessionId);
      // Remove session directory
      if (!sessionsBasePath) {
        throw new Error('Sessions base path not initialized');
      }
      const dir = path.join(sessionsBasePath, sessionId);
      await fs.rm(dir, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // renameChatSession
  ipcMain.handle(
    'chat:rename-session',
    async (_event: IpcMainInvokeEvent, sessionId: string, newName: string) => {
      try {
        // TODO: 실제 세션 이름 변경 구현 필요
        console.log(`Renaming chat session ${sessionId} to: ${newName}`);
        return { success: true };
      } catch (error) {
        console.error('Failed to rename chat session:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );
}
