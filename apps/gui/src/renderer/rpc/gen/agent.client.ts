// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient } from '../../../shared/rpc/transport';
import type { z } from 'zod';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

export class AgentClient {
  constructor(private readonly transport: RpcClient) {}

  chat(payload: z.input<typeof C.methods['chat'].payload>): Promise<z.output<typeof C.methods['chat'].response>> {
    return this.transport.request(C.methods['chat'].channel, payload);
  }

  end_session(payload: z.input<typeof C.methods['end-session'].payload>): Promise<void> {
    return this.transport.request(C.methods['end-session'].channel, payload);
  }

  get_metadata(payload: z.input<typeof C.methods['get-metadata'].payload>): Promise<z.output<typeof C.methods['get-metadata'].response>> {
    return this.transport.request(C.methods['get-metadata'].channel, payload);
  }

  get_all_metadatas(): Promise<z.output<typeof C.methods['get-all-metadatas'].response>> {
    return this.transport.request(C.methods['get-all-metadatas'].channel);
  }

  update(payload: z.input<typeof C.methods['update'].payload>): Promise<z.output<typeof C.methods['update'].response>> {
    return this.transport.request(C.methods['update'].channel, payload);
  }

  create(payload: z.input<typeof C.methods['create'].payload>): Promise<z.output<typeof C.methods['create'].response>> {
    return this.transport.request(C.methods['create'].channel, payload);
  }

  delete(payload: z.input<typeof C.methods['delete'].payload>): Promise<z.output<typeof C.methods['delete'].response>> {
    return this.transport.request(C.methods['delete'].channel, payload);
  }
}
