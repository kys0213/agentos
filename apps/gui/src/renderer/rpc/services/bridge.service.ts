import type { RpcClient } from '../../../shared/rpc/transport';
import type { LlmManifest } from 'llm-bridge-spec';

export class BridgeRpcService {
  constructor(private readonly transport: RpcClient) {}

  // New API (controller-based)
  registerBridge(
    manifest: LlmManifest,
    config: Record<string, unknown> = {},
    id?: string
  ): Promise<{ success: boolean }> {
    return this.transport
      .request<{ id: string }>('bridge.register', { manifest, config, id })
      .then(() => ({ success: true }));
  }
  unregisterBridge(id: string): Promise<{ success: boolean }> {
    return this.transport
      .request<
        | { success: boolean }
        | { success: boolean; result: { success: true } }
        | { success: false; error: string }
      >('bridge.unregister', id)
      .then((res: any) => ({ success: !!res?.success && !res?.error }));
  }
  switchBridge(id: string): Promise<{ success: boolean }> {
    return this.transport
      .request<
        | { success: boolean }
        | { success: boolean; result: { success: true } }
        | { success: false; error: string }
      >('bridge.switch', id)
      .then((res: any) => ({ success: !!res?.success && !res?.error }));
  }
  async getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null> {
    const res = await this.transport.request<{ id: string; manifest: LlmManifest } | null>(
      'bridge.get-current'
    );
    if (!res) return null;
    return { id: res.id, config: res.manifest };
  }
  async getBridgeIds(): Promise<string[]> {
    const summaries = await this.transport.request<Array<{ id: string }>>('bridge.list');
    return summaries.map((s) => s.id);
  }
  getBridgeConfig(id: string): Promise<LlmManifest | null> {
    return this.transport.request('bridge.get-config', id);
  }
}
