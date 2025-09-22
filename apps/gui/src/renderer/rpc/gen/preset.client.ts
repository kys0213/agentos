// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';
import { z } from 'zod';

export class PresetClient {
  constructor(private readonly transport: RpcClient) {}

  async list(): Promise<z.output<(typeof C.methods)['list']['response']>> {
    const resp = await this.transport.request<unknown>(C.methods['list'].channel);
    return C.methods['list'].response.parse(resp);
  }

  async get(
    payload: z.input<(typeof C.methods)['get']['payload']>
  ): Promise<z.output<(typeof C.methods)['get']['response']>> {
    const parsedPayload = C.methods['get'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['get'].channel, parsedPayload);
    return C.methods['get'].response.parse(resp);
  }

  async create(
    payload: z.input<(typeof C.methods)['create']['payload']>
  ): Promise<z.output<(typeof C.methods)['create']['response']>> {
    const parsedPayload = C.methods['create'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['create'].channel, parsedPayload);
    return C.methods['create'].response.parse(resp);
  }

  async update(
    payload: z.input<(typeof C.methods)['update']['payload']>
  ): Promise<z.output<(typeof C.methods)['update']['response']>> {
    const parsedPayload = C.methods['update'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['update'].channel, parsedPayload);
    return C.methods['update'].response.parse(resp);
  }

  async delete(
    payload: z.input<(typeof C.methods)['delete']['payload']>
  ): Promise<z.output<(typeof C.methods)['delete']['response']>> {
    const parsedPayload = C.methods['delete'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['delete'].channel, parsedPayload);
    return C.methods['delete'].response.parse(resp);
  }
}
