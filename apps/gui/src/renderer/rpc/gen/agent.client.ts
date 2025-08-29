// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { z } from 'zod';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

export class AgentClient {
  constructor(private readonly transport: RpcClient) {}

  chat(payload) {
    return this.transport.request(C.methods['chat'].channel, payload);
  }

  end_session(payload) {
    return this.transport.request(C.methods['end-session'].channel, payload);
  }

  get_metadata(payload) {
    return this.transport.request(C.methods['get-metadata'].channel, payload);
  }

  get_all_metadatas() {
    return this.transport.request(C.methods['get-all-metadatas'].channel);
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
