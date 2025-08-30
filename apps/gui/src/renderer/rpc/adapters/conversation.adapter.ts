import { ChatClient } from '../gen/chat.client';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';

export class ConversationServiceAdapter {
  constructor(private readonly client: ChatClient) {}

  listSessions(pagination?: unknown) {
    const payload = pagination ? C.methods['listSessions'].payload.parse(pagination) : undefined;
    if (payload) {
      return this.client
        .listSessions(payload)
        .then((res) => C.methods['listSessions'].response.parse(res));
    }
    return this.client.listSessions().then((res) => C.methods['listSessions'].response.parse(res));
  }

  getMessages(sessionId: string, pagination?: unknown) {
    const payload = C.methods['getMessages'].payload.parse({ sessionId, pagination });
    return this.client.getMessages(payload).then((res) =>
      C.methods['getMessages'].response.parse(res)
    );
  }

  deleteSession(sessionId: string) {
    return this.client
      .deleteSession(C.methods['deleteSession'].payload.parse(sessionId))
      .then((res) => C.methods['deleteSession'].response.parse(res));
  }
}
