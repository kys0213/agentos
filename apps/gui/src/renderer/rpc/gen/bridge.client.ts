import type { RpcClient } from '../../../shared/rpc/transport';
import { Channels } from '../../../shared/rpc/gen/channels';

/** AUTO-GENERATED FILE. DO NOT EDIT. */
export class BridgeClient {
  constructor(private readonly transport: RpcClient) {}

  register(payload: { manifest: unknown; config?: Record<string, unknown>; id?: string }): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.transport.request(Channels.bridge.register, payload);
  }
  unregister(id: string): Promise<{ success: boolean; error?: string }> {
    return this.transport.request(Channels.bridge.unregister, id);
  }
  switch(id: string): Promise<{ success: boolean; error?: string }> {
    return this.transport.request(Channels.bridge.switch, id);
  }
  getCurrent(): Promise<{ id: string; manifest: unknown } | null> {
    return this.transport.request(Channels.bridge.get_current);
  }
  list(): Promise<Array<{ id: string }>> {
    return this.transport.request(Channels.bridge.list);
  }
  getConfig(id: string): Promise<unknown | null> {
    return this.transport.request(Channels.bridge.get_config, id);
  }
}

