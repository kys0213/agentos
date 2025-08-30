import type { LlmManifest } from 'llm-bridge-spec';
import { BridgeClient } from '../gen/bridge.client';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';

export class BridgeServiceAdapter {
  constructor(private readonly client: BridgeClient) {}

  async registerBridge(config: LlmManifest): Promise<{ success: boolean }> {
    const payload = C.methods['register'].payload.parse({ manifest: config });
    const res = C.methods['register'].response.parse(await this.client.register(payload));
    return { success: !!res.success };
  }

  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    const res = C.methods['unregister'].response.parse(await this.client.unregister(id));
    return { success: !!res.success };
  }

  async switchBridge(id: string): Promise<{ success: boolean }> {
    const res = C.methods['switch'].response.parse(await this.client.switch(id));
    return { success: !!res.success };
  }

  async getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null> {
    const cur = C.methods['get-current'].response.parse(await this.client.get_current());
    if (!cur) {
      return null;
    }
    return { id: cur.id, config: cur.manifest as LlmManifest };
  }

  async getBridgeIds(): Promise<string[]> {
    const list = C.methods['list'].response.parse(await this.client.list());
    return list.map((x) => x.id);
  }

  async getBridgeConfig(id: string): Promise<LlmManifest | null> {
    const cfg = C.methods['get-config'].response.parse(await this.client.get_config(id));
    return (cfg as LlmManifest) ?? null;
  }
}
