import type { z } from 'zod';
import { ChatClient } from '../gen/chat.client';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';

export class ConversationServiceAdapter {
  constructor(private readonly client: ChatClient) {}

  listSessions(
    pagination?: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['listSessions']['response']>> {
    return this.client.listSessions(pagination);
  }

  getMessages(
    sessionId: string,
    pagination?: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['getMessages']['response']>> {
    return this.client.getMessages({ sessionId, pagination });
  }

  deleteSession(
    sessionId: z.input<(typeof C.methods)['deleteSession']['payload']>
  ): Promise<z.output<(typeof C.methods)['deleteSession']['response']>> {
    return this.client.deleteSession(sessionId);
  }
}
