// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { z } from 'zod';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';

export class BridgeClient {
  constructor(private readonly transport: RpcClient) {}

  register(payload) {
    return this.transport.request(C.methods['register'].channel, payload);
  }

  unregister(payload) {
    return this.transport.request(C.methods['unregister'].channel, payload);
  }

  switch(payload) {
    return this.transport.request(C.methods['switch'].channel, payload);
  }

  list() {
    return this.transport.request(C.methods['list'].channel);
  }
}
