import type { RpcClient } from '../../../shared/rpc/transport';
import { Channels } from '../../../shared/rpc/gen/channels';

/** AUTO-GENERATED FILE. DO NOT EDIT. */
export class BridgeClient {
  constructor(private readonly transport: RpcClient) {}

  register(payload: { manifest: unknown; config?: Record<string, unknown>; id?: string }) {
    return this.transport.request(Channels.bridge.register, payload);
  }
  unregister(id: string) {
    return this.transport.request(Channels.bridge.unregister, id);
  }
  switch(id: string) {
    return this.transport.request(Channels.bridge.switch, id);
  }
  getCurrent() {
    return this.transport.request(Channels.bridge.get_current);
  }
  list() {
    return this.transport.request(Channels.bridge.list);
  }
  getConfig(id: string) {
    return this.transport.request(Channels.bridge.get_config, id);
  }
}

