// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { z } from 'zod';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';

export class ChatClient {
  constructor(private readonly transport: RpcClient) {}

  listSessions(payload) {
    return this.transport.request(C.methods['listSessions'].channel, payload);
  }

  getMessages(payload) {
    return this.transport.request(C.methods['getMessages'].channel, payload);
  }

  deleteSession(payload) {
    return this.transport.request(C.methods['deleteSession'].channel, payload);
  }
}
