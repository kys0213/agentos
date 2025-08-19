import type { RpcClient } from '../../../shared/rpc/transport';
import type {
  CursorPagination,
  CursorPaginationResult,
  ChatSessionDescription,
  MessageHistory,
} from '@agentos/core';

export class ConversationRpcService {
  constructor(private readonly transport: RpcClient) {}

  listSessions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<ChatSessionDescription>> {
    return this.transport.request('chat:list-sessions', pagination);
  }

  getMessages(
    sessionId: string,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Readonly<MessageHistory>>> {
    return this.transport.request('chat:get-messages', { sessionId, pagination });
  }

  deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    return this.transport.request('chat:delete-session', sessionId);
  }
}
