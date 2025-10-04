import type { z } from 'zod';
import { ChatClient } from '../gen/chat.client';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';

type ListSessionsPayload = z.input<(typeof C.methods)['listSessions']['payload']>;
type GetMessagesPayload = z.input<(typeof C.methods)['getMessages']['payload']>;
type DeleteSessionPayload = z.input<(typeof C.methods)['deleteSession']['payload']>;

export class ConversationServiceAdapter {
  constructor(private readonly client: ChatClient) {}

  listSessions(
    agentId: string,
    pagination?: ListSessionsPayload['pagination']
  ): Promise<z.output<(typeof C.methods)['listSessions']['response']>> {
    return this.client.listSessions({ agentId, pagination });
  }

  getMessages(
    agentId: string,
    sessionId: string,
    pagination?: GetMessagesPayload['pagination']
  ): Promise<z.output<(typeof C.methods)['getMessages']['response']>> {
    return this.client.getMessages({ agentId, sessionId, pagination });
  }

  deleteSession(
    agentId: string,
    sessionId: DeleteSessionPayload['sessionId']
  ): Promise<z.output<(typeof C.methods)['deleteSession']['response']>> {
    return this.client.deleteSession({ agentId, sessionId });
  }
}
