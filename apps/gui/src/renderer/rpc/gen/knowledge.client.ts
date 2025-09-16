// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { KnowledgeContract as C } from '../../../shared/rpc/contracts/knowledge.contract';
import { z } from 'zod';

export class KnowledgeClient {
  constructor(private readonly transport: RpcClient) {}

  async createForAgent(
    payload: z.input<(typeof C.methods)['createForAgent']['payload']>
  ): Promise<z.output<(typeof C.methods)['createForAgent']['response']>> {
    const parsedPayload = C.methods['createForAgent'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['createForAgent'].channel,
      parsedPayload
    );
    return C.methods['createForAgent'].response.parse(resp);
  }

  async getByAgent(
    payload: z.input<(typeof C.methods)['getByAgent']['payload']>
  ): Promise<z.output<(typeof C.methods)['getByAgent']['response']>> {
    const parsedPayload = C.methods['getByAgent'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['getByAgent'].channel,
      parsedPayload
    );
    return C.methods['getByAgent'].response.parse(resp);
  }

  async addDocument(
    payload: z.input<(typeof C.methods)['addDocument']['payload']>
  ): Promise<z.output<(typeof C.methods)['addDocument']['response']>> {
    const parsedPayload = C.methods['addDocument'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['addDocument'].channel,
      parsedPayload
    );
    return C.methods['addDocument'].response.parse(resp);
  }

  async removeDocument(
    payload: z.input<(typeof C.methods)['removeDocument']['payload']>
  ): Promise<z.output<(typeof C.methods)['removeDocument']['response']>> {
    const parsedPayload = C.methods['removeDocument'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['removeDocument'].channel,
      parsedPayload
    );
    return C.methods['removeDocument'].response.parse(resp);
  }

  async listDocuments(
    payload: z.input<(typeof C.methods)['listDocuments']['payload']>
  ): Promise<z.output<(typeof C.methods)['listDocuments']['response']>> {
    const parsedPayload = C.methods['listDocuments'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['listDocuments'].channel,
      parsedPayload
    );
    return C.methods['listDocuments'].response.parse(resp);
  }

  async readDocument(
    payload: z.input<(typeof C.methods)['readDocument']['payload']>
  ): Promise<z.output<(typeof C.methods)['readDocument']['response']>> {
    const parsedPayload = C.methods['readDocument'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['readDocument'].channel,
      parsedPayload
    );
    return C.methods['readDocument'].response.parse(resp);
  }

  async indexAll(
    payload: z.input<(typeof C.methods)['indexAll']['payload']>
  ): Promise<z.output<(typeof C.methods)['indexAll']['response']>> {
    const parsedPayload = C.methods['indexAll'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['indexAll'].channel,
      parsedPayload
    );
    return C.methods['indexAll'].response.parse(resp);
  }

  async search(
    payload: z.input<(typeof C.methods)['search']['payload']>
  ): Promise<z.output<(typeof C.methods)['search']['response']>> {
    const parsedPayload = C.methods['search'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(C.methods['search'].channel, parsedPayload);
    return C.methods['search'].response.parse(resp);
  }

  async getStats(
    payload: z.input<(typeof C.methods)['getStats']['payload']>
  ): Promise<z.output<(typeof C.methods)['getStats']['response']>> {
    const parsedPayload = C.methods['getStats'].payload.parse(payload);
    const resp = await this.transport.request<unknown>(
      C.methods['getStats'].channel,
      parsedPayload
    );
    return C.methods['getStats'].response.parse(resp);
  }
}
