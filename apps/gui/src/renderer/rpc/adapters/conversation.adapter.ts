import { ChatClient } from '../gen/chat.client';

export class ConversationServiceAdapter {
  constructor(private readonly client: ChatClient) {}

  listSessions(pagination?: unknown) {
    return this.client.listSessions(pagination);
  }

  getMessages(sessionId: string, pagination?: unknown) {
    return this.client.getMessages({ sessionId, pagination });
  }

  deleteSession(sessionId: string) {
    return this.client.deleteSession(sessionId);
  }
}
