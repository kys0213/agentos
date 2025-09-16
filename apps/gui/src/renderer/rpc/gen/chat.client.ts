// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { ChatContract as C } from '../../../shared/rpc/contracts/chat.contract';
import { z } from 'zod';

export class ChatClient {
  constructor(private readonly transport: RpcClient) {}

  async listSessions(payload: z.input<typeof C.methods['listSessions']['payload']>): Promise<z.output<typeof C.methods['listSessions']['response']>> {
    const parsedPayload = C.methods['listSessions'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['listSessions'].channel, parsedPayload);
    return C.methods['listSessions'].response.parse(resp);
  }

  async getMessages(payload: z.input<typeof C.methods['getMessages']['payload']>): Promise<z.output<typeof C.methods['getMessages']['response']>> {
    const parsedPayload = C.methods['getMessages'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['getMessages'].channel, parsedPayload);
    return C.methods['getMessages'].response.parse(resp);
  }

  async deleteSession(payload: z.input<typeof C.methods['deleteSession']['payload']>): Promise<z.output<typeof C.methods['deleteSession']['response']>> {
    const parsedPayload = C.methods['deleteSession'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['deleteSession'].channel, parsedPayload);
    return C.methods['deleteSession'].response.parse(resp);
  }
}
