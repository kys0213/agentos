// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { z } from 'zod';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

export class AgentClient {
  constructor(private readonly transport: RpcClient) {}

  chat(payload) {
    return this.transport.request(C.methods['chat'].channel, payload);
  }

  update(payload) {
    return this.transport.request(C.methods['update'].channel, payload);
  }

  create(payload) {
    return this.transport.request(C.methods['create'].channel, payload);
  }

  delete(payload) {
    return this.transport.request(C.methods['delete'].channel, payload);
  }
}
