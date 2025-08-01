import type { IpcChannel } from './ipc/IpcChannel';
import type {
  ChatSessionDescription,
  Preset,
  SendMessageResponse,
  MessageListResponse,
  PaginationOptions,
} from '../types/core-types';

/**
 * 채팅 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class ChatService {
  constructor(private ipcChannel: IpcChannel) {}

  // ==================== 기본 Chat 메서드들 ====================

  async createSession(options?: { preset?: Preset }): Promise<ChatSessionDescription> {
    return this.ipcChannel.createChatSession(options);
  }

  async listSessions(): Promise<ChatSessionDescription[]> {
    return this.ipcChannel.listChatSessions();
  }

  async loadSession(sessionId: string): Promise<ChatSessionDescription> {
    return this.ipcChannel.loadChatSession(sessionId);
  }

  async sendMessage(sessionId: string, message: string): Promise<SendMessageResponse> {
    return this.ipcChannel.sendChatMessage(sessionId, message);
  }

  async streamMessage(sessionId: string, message: string): Promise<ReadableStream> {
    return this.ipcChannel.streamChatMessage(sessionId, message);
  }

  async getMessages(sessionId: string, options?: PaginationOptions): Promise<MessageListResponse> {
    return this.ipcChannel.getChatMessages(sessionId, options);
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    return this.ipcChannel.deleteChatSession(sessionId);
  }

  async renameSession(sessionId: string, newName: string): Promise<{ success: boolean }> {
    return this.ipcChannel.renameChatSession(sessionId, newName);
  }

  // ==================== 호환성을 위한 메서드들 ====================

  /**
   * 기존 ChatManager와의 호환성을 위한 메서드
   * @deprecated createSession을 직접 사용하세요
   */
  async create(options?: { preset?: Preset }): Promise<ChatSessionDescription> {
    return this.createSession(options);
  }

  /**
   * 기존 ChatManager와의 호환성을 위한 메서드
   * @deprecated listSessions를 직접 사용하세요
   */
  async list(options?: any): Promise<{ items: ChatSessionDescription[]; nextCursor: string }> {
    const sessions = await this.listSessions();
    return { items: sessions || [], nextCursor: '' };
  }

  /**
   * 기존 ChatManager와의 호환성을 위한 메서드
   * @deprecated loadSession을 직접 사용하세요
   */
  async load(options: { sessionId: string }): Promise<ChatSessionDescription> {
    return this.loadSession(options.sessionId);
  }
}
