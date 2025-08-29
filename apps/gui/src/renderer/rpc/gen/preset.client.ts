// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { z } from 'zod';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';

export class PresetClient {
  constructor(private readonly transport: RpcClient) {}

  list() {
    return this.transport.request(C.methods['list'].channel);
  }

  get(payload) {
    return this.transport.request(C.methods['get'].channel, payload);
  }

  create(payload) {
    return this.transport.request(C.methods['create'].channel, payload);
  }

  update(payload) {
    return this.transport.request(C.methods['update'].channel, payload);
  }

  delete(payload) {
    return this.transport.request(C.methods['delete'].channel, payload);
  }
}
