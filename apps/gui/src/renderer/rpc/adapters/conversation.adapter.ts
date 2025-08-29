import { ChatClient } from '../gen/chat.client';

export class ConversationServiceAdapter {
  constructor(private readonly client: ChatClient) {}

  listSessions(pagination?: unknown) {
    return this.client.listSessions(pagination as any);
  }

  getMessages(sessionId: string, pagination?: unknown) {
    return this.client.getMessages({ sessionId, pagination } as any);
  }

  deleteSession(sessionId: string) {
    return this.client.deleteSession(sessionId);
  }
}
