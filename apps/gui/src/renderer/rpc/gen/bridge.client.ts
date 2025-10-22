// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';
import { z } from 'zod';

export class BridgeClient {
  constructor(private readonly transport: RpcClient) {}

  async register(payload: z.input<typeof C.methods['register']['payload']>): Promise<z.output<typeof C.methods['register']['response']>> {
    const parsedPayload = C.methods['register'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['register'].channel, parsedPayload);
    return C.methods['register'].response.parse(resp);
  }

  async unregister(payload: z.input<typeof C.methods['unregister']['payload']>): Promise<z.output<typeof C.methods['unregister']['response']>> {
    const parsedPayload = C.methods['unregister'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['unregister'].channel, parsedPayload);
    return C.methods['unregister'].response.parse(resp);
  }

  async switch(payload: z.input<typeof C.methods['switch']['payload']>): Promise<z.output<typeof C.methods['switch']['response']>> {
    const parsedPayload = C.methods['switch'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['switch'].channel, parsedPayload);
    return C.methods['switch'].response.parse(resp);
  }

  async get_current(): Promise<z.output<typeof C.methods['get-current']['response']>> {
    const resp = await this.transport.request<unknown>(C.methods['get-current'].channel);
    return C.methods['get-current'].response.parse(resp);
  }

  async list(): Promise<z.output<typeof C.methods['list']['response']>> {
    const resp = await this.transport.request<unknown>(C.methods['list'].channel);
    return C.methods['list'].response.parse(resp);
  }

  async get_config(payload: z.input<typeof C.methods['get-config']['payload']>): Promise<z.output<typeof C.methods['get-config']['response']>> {
    const parsedPayload = C.methods['get-config'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['get-config'].channel, parsedPayload);
    return C.methods['get-config'].response.parse(resp);
  }
}
