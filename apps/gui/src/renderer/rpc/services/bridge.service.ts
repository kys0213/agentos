import type { RpcTransport } from '../../../shared/rpc/transport';
import type { LlmManifest } from 'llm-bridge-spec';

export class BridgeRpcService {
  constructor(private readonly transport: RpcTransport) {}

  registerBridge(config: LlmManifest): Promise<{ success: boolean }> {
    return this.transport.request('bridge:register-bridge', config);
  }
  unregisterBridge(id: string): Promise<{ success: boolean }> {
    return this.transport.request('bridge:unregister-bridge', id);
  }
  switchBridge(id: string): Promise<{ success: boolean }> {
    return this.transport.request('bridge:switch', id);
  }
  getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null> {
    return this.transport.request('bridge:get-current');
  }
  getBridgeIds(): Promise<string[]> {
    return this.transport.request('bridge:get-ids');
  }
  getBridgeConfig(id: string): Promise<LlmManifest | null> {
    return this.transport.request('bridge:get-config', id);
  }
}
