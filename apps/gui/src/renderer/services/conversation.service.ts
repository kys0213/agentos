import type {
  CursorPagination,
  CursorPaginationResult,
  ChatSessionDescription,
  MessageHistory,
} from '@agentos/core';
import type { IpcChannel } from '../../shared/types/ipc-channel';
import type { ConversationProtocol } from '../../shared/types/agent-protocol';

export class ConversationService implements ConversationProtocol {
  constructor(private readonly ipc: IpcChannel) {}

  async listSessions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<ChatSessionDescription>> {
    return this.ipc.listSessions(pagination);
  }

  async getMessages(
    sessionId: string,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>> {
    return this.ipc.getMessages(sessionId, pagination);
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string | undefined }> {
    return this.ipc.deleteSession(sessionId);
  }
}

