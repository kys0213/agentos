// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import type { z } from 'zod';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

export class AgentClient {
  constructor(private readonly transport: RpcClient) {}

  methods(payload: z.input<typeof C.methods['methods'].payload>): Promise<void> {
    return this.transport.request(C.methods['methods'].channel, payload);
  }

  update(payload: z.input<typeof C.methods['update'].payload>): Promise<void> {
    return this.transport.request(C.methods['update'].channel, payload);
  }

  create(payload: z.input<typeof C.methods['create'].payload>): Promise<z.output<typeof C.methods['create'].response>> {
    return this.transport.request(C.methods['create'].channel, payload);
  }

  delete(payload: z.input<typeof C.methods['delete'].payload>): Promise<z.output<typeof C.methods['delete'].response>> {
    return this.transport.request(C.methods['delete'].channel, payload);
  }
}
