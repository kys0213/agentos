// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';
import type * as T from '../../../shared/rpc/gen/preset.types';

export class PresetClient {
  constructor(private readonly transport: RpcClient) {}

  list(): Promise<T.list_Result> {
    return this.transport.request(C.methods['list'].channel);
  }

  get(payload: T.get_Payload): Promise<T.get_Result> {
    return this.transport.request(C.methods['get'].channel, payload);
  }

  create(payload: T.create_Payload): Promise<T.create_Result> {
    return this.transport.request(C.methods['create'].channel, payload);
  }

  update(payload: T.update_Payload): Promise<T.update_Result> {
    return this.transport.request(C.methods['update'].channel, payload);
  }

  delete(payload: T.delete_Payload): Promise<T.delete_Result> {
    return this.transport.request(C.methods['delete'].channel, payload);
  }
}
