// AUTO-GENERATED FILE. DO NOT EDIT.
import type { RpcClient, CloseFn } from '../../../shared/rpc/transport';
import type { z } from 'zod';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';

export class PresetClient {
  constructor(private readonly transport: RpcClient) {}

  list(): Promise<z.output<typeof C.methods['list'].response>> {
    return this.transport.request(C.methods['list'].channel);
  }

  get(payload: z.input<typeof C.methods['get'].payload>): Promise<z.output<typeof C.methods['get'].response>> {
    return this.transport.request(C.methods['get'].channel, payload);
  }

  create(payload: z.input<typeof C.methods['create'].payload>): Promise<z.output<typeof C.methods['create'].response>> {
    return this.transport.request(C.methods['create'].channel, payload);
  }

  update(payload: z.input<typeof C.methods['update'].payload>): Promise<void> {
    return this.transport.request(C.methods['update'].channel, payload);
  }

  delete(payload: z.input<typeof C.methods['delete'].payload>): Promise<z.output<typeof C.methods['delete'].response>> {
    return this.transport.request(C.methods['delete'].channel, payload);
  }
}
