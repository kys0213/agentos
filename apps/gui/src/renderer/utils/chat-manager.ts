import { ServiceContainer } from '../services/ServiceContainer';
import type { ChatService } from '../services/chat-service';
import type { ChatSessionDescription, Preset } from '../types/core-types';

/**
 * @deprecated createChatManager()는 더 이상 사용되지 않습니다.
 * 대신 ServiceContainer.get('chat') 또는 Services.getChat()를 사용하세요.
 *
 * 기존 코드와의 호환성을 위해 ChatService로 위임하는 래퍼 함수
 */
export function createChatManager(): ChatManagerCompat {
  console.warn('createChatManager() is deprecated. Use ServiceContainer.get("chat") instead.');
  return new ChatManagerCompat();
}

/**
 * 기존 ChatManager 인터페이스와의 호환성을 위한 래퍼 클래스
 */
class ChatManagerCompat {
  private get chatService(): ChatService {
    return ServiceContainer.get<ChatService>('chat');
  }

  /**
   * @deprecated chatService.createSession()을 직접 사용하세요
   */
  async create(options?: { preset?: Preset }): Promise<ChatSessionDescription> {
    return this.chatService.createSession(options);
  }

  /**
   * @deprecated chatService.listSessions()를 직접 사용하세요
   */
  async list(options?: any): Promise<{ items: ChatSessionDescription[]; nextCursor: string }> {
    const sessions = await this.chatService.listSessions();
    return { items: sessions || [], nextCursor: '' };
  }

  /**
   * @deprecated chatService.loadSession()을 직접 사용하세요
   */
  async load(options: { sessionId: string }): Promise<ChatSessionDescription> {
    return this.chatService.loadSession(options.sessionId);
  }

  /**
   * @deprecated chatService.sendMessage()를 직접 사용하세요
   */
  async sendMessage(sessionId: string, message: string) {
    return this.chatService.sendMessage(sessionId, message);
  }

  /**
   * @deprecated chatService.deleteSession()을 직접 사용하세요
   */
  async deleteSession(sessionId: string) {
    return this.chatService.deleteSession(sessionId);
  }

  /**
   * @deprecated chatService.renameSession()을 직접 사용하세요
   */
  async renameSession(sessionId: string, newName: string) {
    return this.chatService.renameSession(sessionId, newName);
  }
}
