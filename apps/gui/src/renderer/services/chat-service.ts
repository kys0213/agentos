import type { ChatAPI } from '../../shared/types/electron-api';

// IPC 기반 채팅 서비스 클라이언트
export class ChatService {
  private get api(): ChatAPI {
    return window.electronAPI.chat;
  }

  async createSession(options?: { preset?: any }) {
    return this.api.createSession(options);
  }

  async listSessions() {
    return this.api.listSessions();
  }

  async loadSession(sessionId: string) {
    return this.api.loadSession(sessionId);
  }

  async sendMessage(sessionId: string, message: string) {
    return this.api.sendMessage(sessionId, message);
  }

  // ChatManager 호환성을 위한 메서드들
  async create(options?: { preset?: any }) {
    return this.createSession(options);
  }

  async list(options?: any) {
    const sessions = await this.listSessions();
    return { items: sessions || [], nextCursor: '' };
  }

  async load(options: { sessionId: string }) {
    return this.loadSession(options.sessionId);
  }
}

export const chatService = new ChatService();