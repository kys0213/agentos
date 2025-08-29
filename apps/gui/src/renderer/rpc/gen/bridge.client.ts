// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';
import { z } from 'zod';

export class BridgeClient {
  constructor(private readonly transport: RpcClient) {}

  register(payload: z.input<typeof C.methods['register']['payload']>): Promise<z.output<typeof C.methods['register']['response']>> {
    return this.transport.request(C.methods['register'].channel, payload);
  }

  unregister(payload: z.input<typeof C.methods['unregister']['payload']>): Promise<z.output<typeof C.methods['unregister']['response']>> {
    return this.transport.request(C.methods['unregister'].channel, payload);
  }

  switch(payload: z.input<typeof C.methods['switch']['payload']>): Promise<z.output<typeof C.methods['switch']['response']>> {
    return this.transport.request(C.methods['switch'].channel, payload);
  }

  get_current(): Promise<z.output<typeof C.methods['get-current']['response']>> {
    return this.transport.request(C.methods['get-current'].channel);
  }

  list(): Promise<z.output<typeof C.methods['list']['response']>> {
    return this.transport.request(C.methods['list'].channel);
  }

  get_config(payload: z.input<typeof C.methods['get-config']['payload']>): Promise<z.output<typeof C.methods['get-config']['response']>> {
    return this.transport.request(C.methods['get-config'].channel, payload);
  }
}
