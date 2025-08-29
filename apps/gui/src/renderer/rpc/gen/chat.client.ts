// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';
import type * as T from '../../../shared/rpc/gen/chat.types';

export class ChatClient {
  constructor(private readonly transport: RpcClient) {}

  listSessions(payload: T.listSessions_Payload): Promise<T.listSessions_Result> {
    return this.transport.request(C.methods['listSessions'].channel, payload);
  }

  getMessages(payload: T.getMessages_Payload): Promise<T.getMessages_Result> {
    return this.transport.request(C.methods['getMessages'].channel, payload);
  }

  deleteSession(payload: T.deleteSession_Payload): Promise<T.deleteSession_Result> {
    return this.transport.request(C.methods['deleteSession'].channel, payload);
  }
}
