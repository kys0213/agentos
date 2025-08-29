// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import type { z } from 'zod';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';

export class BridgeClient {
  constructor(private readonly transport: RpcClient) {}

  methods(payload: z.input<typeof C.methods['methods'].payload>): Promise<void> {
    return this.transport.request(C.methods['methods'].channel, payload);
  }

  unregister(payload: z.input<typeof C.methods['unregister'].payload>): Promise<z.output<typeof C.methods['unregister'].response>> {
    return this.transport.request(C.methods['unregister'].channel, payload);
  }

  switch(payload: z.input<typeof C.methods['switch'].payload>): Promise<z.output<typeof C.methods['switch'].response>> {
    return this.transport.request(C.methods['switch'].channel, payload);
  }

  list(): Promise<z.output<typeof C.methods['list'].response>> {
    return this.transport.request(C.methods['list'].channel);
  }
}
