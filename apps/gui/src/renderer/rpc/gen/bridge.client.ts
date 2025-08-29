// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';
import type * as T from '../../../shared/rpc/gen/bridge.types';

export class BridgeClient {
  constructor(private readonly transport: RpcClient) {}

  register(payload: T.register_Payload): Promise<T.register_Result> {
    return this.transport.request(C.methods['register'].channel, payload);
  }

  unregister(payload: T.unregister_Payload): Promise<T.unregister_Result> {
    return this.transport.request(C.methods['unregister'].channel, payload);
  }

  switch(payload: T.switch_Payload): Promise<T.switch_Result> {
    return this.transport.request(C.methods['switch'].channel, payload);
  }

  get_current(): Promise<T.get_current_Result> {
    return this.transport.request(C.methods['get-current'].channel);
  }

  list(): Promise<T.list_Result> {
    return this.transport.request(C.methods['list'].channel);
  }

  get_config(payload: T.get_config_Payload): Promise<T.get_config_Result> {
    return this.transport.request(C.methods['get-config'].channel, payload);
  }
}
