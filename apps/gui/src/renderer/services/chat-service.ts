import type { IpcChannel } from '../../shared/types/ipc-channel';
import type { ChatSessionMetadata } from '@agentos/core';

export interface ListMessagesResult {
  messages: any[];
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

// Temporary compatibility adapter until chat flows are migrated to Agent API
export class ChatService {
  // Currently unused, reserved for future wiring to Agent-based chat sessions
  constructor(_ipcChannel: IpcChannel) {}

  async listSessions(): Promise<ChatSessionMetadata[]> {
    return [];
  }

  async loadSession(_sessionId: string): Promise<ChatSessionMetadata> {
    const now = new Date();
    return {
      sessionId: _sessionId,
      createdAt: now,
      updatedAt: now,
      title: 'Loaded Session',
      totalMessages: 0,
      totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      recentMessages: [],
      joinedAgents: [],
    };
  }

  async createSession(_options?: { preset?: any }): Promise<ChatSessionMetadata> {
    const now = new Date();
    return {
      sessionId: `session_${now.getTime()}`,
      createdAt: now,
      updatedAt: now,
      title: 'New Session',
      totalMessages: 0,
      totalUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      recentMessages: [],
      joinedAgents: [],
    };
  }

  async getMessages(_sessionId: string, _options?: any): Promise<ListMessagesResult> {
    return { messages: [], total: 0, hasMore: false, nextCursor: undefined };
  }

  async sendMessage(_sessionId: string, _text: string): Promise<{ success: boolean; messageId?: string; error?: string }>{
    return { success: true, messageId: `msg_${Date.now()}` };
  }

  async deleteSession(_sessionId: string): Promise<{ success: boolean; error?: string }>{
    return { success: true };
  }
}
