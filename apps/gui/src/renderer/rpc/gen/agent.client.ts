// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';
import { z } from 'zod';

export class AgentClient {
  constructor(private readonly transport: RpcClient) {}

  async chat(payload: z.input<typeof C.methods['chat']['payload']>): Promise<z.output<typeof C.methods['chat']['response']>> {
    const parsedPayload = C.methods['chat'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['chat'].channel, parsedPayload);
    return C.methods['chat'].response.parse(resp);
  }

  async end_session(payload: z.input<typeof C.methods['end-session']['payload']>): Promise<void> {
    const parsedPayload = C.methods['end-session'].payload.parse(payload);
    await this.transport.request<void>(C.methods['end-session'].channel, parsedPayload);
    return undefined as unknown as void;
  }

  async get_metadata(payload: z.input<typeof C.methods['get-metadata']['payload']>): Promise<z.output<typeof C.methods['get-metadata']['response']>> {
    const parsedPayload = C.methods['get-metadata'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['get-metadata'].channel, parsedPayload);
    return C.methods['get-metadata'].response.parse(resp);
  }

  async get_all_metadatas(): Promise<z.output<typeof C.methods['get-all-metadatas']['response']>> {
    const resp = await this.transport.request<unknown>(C.methods['get-all-metadatas'].channel);
    return C.methods['get-all-metadatas'].response.parse(resp);
  }

  async update(payload: z.input<typeof C.methods['update']['payload']>): Promise<z.output<typeof C.methods['update']['response']>> {
    const parsedPayload = C.methods['update'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['update'].channel, parsedPayload);
    return C.methods['update'].response.parse(resp);
  }

  async create(payload: z.input<typeof C.methods['create']['payload']>): Promise<z.output<typeof C.methods['create']['response']>> {
    const parsedPayload = C.methods['create'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['create'].channel, parsedPayload);
    return C.methods['create'].response.parse(resp);
  }

  async delete(payload: z.input<typeof C.methods['delete']['payload']>): Promise<z.output<typeof C.methods['delete']['response']>> {
    const parsedPayload = C.methods['delete'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['delete'].channel, parsedPayload);
    return C.methods['delete'].response.parse(resp);
  }
}
