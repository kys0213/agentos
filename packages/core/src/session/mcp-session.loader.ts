import { Storage } from '../storage/storage';
import { ChatSession } from './chat-session';

export class ChatSessionLoader {
  constructor(private readonly storage: Storage) {}

  async load(sessionId: string): Promise<ChatSession> {
    const session = await this.storage.load<{ sessionId: string }>(sessionId);

    return {
      sessionId: session.sessionId,
    };
  }

  async save(session: { sessionId: string }): Promise<void> {
    return this.storage.save(session);
  }

  async delete(sessionId: string): Promise<void> {
    return this.storage.delete(sessionId);
  }
}
