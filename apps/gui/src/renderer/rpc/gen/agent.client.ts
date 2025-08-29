// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';
import type * as T from '../../../shared/rpc/gen/agent.types';

export class AgentClient {
  constructor(private readonly transport: RpcClient) {}

  chat(payload: T.chat_Payload): Promise<T.chat_Result> {
    return this.transport.request(C.methods['chat'].channel, payload);
  }

  end_session(payload: T.end_session_Payload): Promise<void> {
    return this.transport.request(C.methods['end-session'].channel, payload);
  }

  get_metadata(payload: T.get_metadata_Payload): Promise<T.get_metadata_Result> {
    return this.transport.request(C.methods['get-metadata'].channel, payload);
  }

  get_all_metadatas(): Promise<T.get_all_metadatas_Result> {
    return this.transport.request(C.methods['get-all-metadatas'].channel);
  }

  update(payload: T.update_Payload): Promise<T.update_Result> {
    return this.transport.request(C.methods['update'].channel, payload);
  }

  create(payload: T.create_Payload): Promise<T.create_Result> {
    return this.transport.request(C.methods['create'].channel, payload);
  }

  delete(payload: T.delete_Payload): Promise<T.delete_Result> {
    return this.transport.request(C.methods['delete'].channel, payload);
  }
}
