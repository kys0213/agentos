import { ipcMain, IpcMainInvokeEvent, app } from 'electron';
import { ChatManager, FileBasedChatManager, FileBasedSessionStorage } from '@agentos/core';
import * as path from 'path';
import { NoopCompressor } from '../NoopCompressor';

let chatManager: ChatManager | null = null;

function initializeChatManager(): ChatManager {
  if (chatManager) return chatManager;

  const userDataPath = app.getPath('userData');
  const sessionsPath = path.join(userDataPath, 'sessions');

  const sessionStorage = new FileBasedSessionStorage(sessionsPath);
  const historyCompressor = new NoopCompressor();
  const titleCompressor = new NoopCompressor();

  chatManager = new FileBasedChatManager(sessionStorage, historyCompressor, titleCompressor);

  console.log('Chat manager initialized');
  return chatManager;
}

export function setupChatIpcHandlers() {
  const manager = initializeChatManager();
  // Chat Session handlers
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

  ipcMain.handle('chat:list-sessions', async (_event: IpcMainInvokeEvent) => {
    try {
      const result = await manager.list();
      return result;
    } catch (error) {
      console.error('Failed to list chat sessions:', error);
      throw error;
    }
  });

  ipcMain.handle('chat:load-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      const session = await manager.load({ sessionId });
      return session;
    } catch (error) {
      console.error('Failed to load chat session:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'chat:send-message',
    async (_event: IpcMainInvokeEvent, sessionId: string, message: string) => {
      try {
        // This would need the actual send implementation from the chat manager
        // For now, return a placeholder
        return { success: true, sessionId, message };
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    }
  );
}
