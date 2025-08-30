// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';
import { z } from 'zod';

export class ChatClient {
  constructor(private readonly transport: RpcClient) {}

  listSessions(
    payload: z.input<(typeof C.methods)['listSessions']['payload']>
  ): Promise<z.output<(typeof C.methods)['listSessions']['response']>> {
    return this.transport.request(C.methods['listSessions'].channel, payload);
  }

  getMessages(
    payload: z.input<(typeof C.methods)['getMessages']['payload']>
  ): Promise<z.output<(typeof C.methods)['getMessages']['response']>> {
    return this.transport.request(C.methods['getMessages'].channel, payload);
  }

  deleteSession(
    payload: z.input<(typeof C.methods)['deleteSession']['payload']>
  ): Promise<z.output<(typeof C.methods)['deleteSession']['response']>> {
    return this.transport.request(C.methods['deleteSession'].channel, payload);
  }
}
