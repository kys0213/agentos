import type { RpcTransport } from '../../../shared/rpc/transport';
import type { LlmManifest } from 'llm-bridge-spec';

export class BridgeRpcService {
  constructor(private readonly transport: RpcTransport) {}

  // New API (controller-based)
  registerBridge(manifest: LlmManifest, config: Record<string, unknown> = {}, id?: string): Promise<{ id: string }> {
    return this.transport.request('bridge.register', { manifest, config, id });
  }
  unregisterBridge(id: string): Promise<{ success: boolean }> {
    return this.transport.request('bridge.unregister', id);
  }
  switchBridge(id: string): Promise<{ success: boolean }> {
    return this.transport.request('bridge.switch', id);
  }
  getCurrentBridge(): Promise<{ id: string; manifest: LlmManifest } | null> {
    return this.transport.request('bridge.get-current');
  }
  async getBridgeIds(): Promise<string[]> {
    const summaries = await this.transport.request<Array<{ id: string }>>('bridge.list');
    return summaries.map((s) => s.id);
  }
  getBridgeConfig(id: string): Promise<LlmManifest | null> {
    return this.transport.request('bridge.get-config', id);
  }
}
