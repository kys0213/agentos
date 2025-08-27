import type { RpcClient } from '../../../shared/rpc/transport';
import { Channels } from '../../../shared/rpc/gen/channels';
import type { CursorPaginationResult } from '@agentos/core';

/** AUTO-GENERATED FILE. DO NOT EDIT. */
export class PresetClient {
  constructor(private readonly transport: RpcClient) {}

  list(): Promise<CursorPaginationResult<{ id: string; name: string }>> {
    return this.transport.request(Channels.preset.list);
  }

  get(id: string) {
    return this.transport.request(Channels.preset.get, id);
  }

  create(preset: unknown) {
    return this.transport.request(Channels.preset.create, preset);
  }

  update(id: string, preset: unknown) {
    return this.transport.request(Channels.preset.update, { id, preset });
  }

  delete(id: string) {
    return this.transport.request(Channels.preset.delete, id);
  }
}

