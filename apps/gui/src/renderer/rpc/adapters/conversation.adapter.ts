import type { z } from 'zod';
import { ChatClient } from '../gen/chat.client';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';

export class ConversationServiceAdapter {
  constructor(private readonly client: ChatClient) {}

  listSessions(
    pagination?: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['listSessions']['response']>> {
    const payload = pagination
      ? C.methods['listSessions'].payload.parse(pagination)
      : undefined;
    return this.client.listSessions(payload).then((res) =>
      C.methods['listSessions'].response.parse(res)
    );
  }

  getMessages(
    sessionId: string,
    pagination?: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['getMessages']['response']>> {
    const payload = C.methods['getMessages'].payload.parse({ sessionId, pagination });
    return this.client.getMessages(payload).then((res) =>
      C.methods['getMessages'].response.parse(res)
    );
  }

  deleteSession(
    sessionId: z.input<(typeof C.methods)['deleteSession']['payload']>
  ): Promise<z.output<(typeof C.methods)['deleteSession']['response']>> {
    return this.client
      .deleteSession(C.methods['deleteSession'].payload.parse(sessionId))
      .then((res) => C.methods['deleteSession'].response.parse(res));
  }
}
