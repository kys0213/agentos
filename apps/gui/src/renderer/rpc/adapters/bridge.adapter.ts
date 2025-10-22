import type { LlmManifest } from 'llm-bridge-spec';
import { BridgeClient } from '../gen/bridge.client';

export interface BridgeSummary {
  id: string;
  name: string;
  description: string;
  language: string;
  configured: boolean;
  available: boolean;
}

export class BridgeServiceAdapter {
  constructor(private readonly client: BridgeClient) {}

  async registerBridge(config: LlmManifest): Promise<{ success: boolean }> {
    const res = await this.client.register({ manifest: config });
    return { success: !!res.success };
  }

  async unregisterBridge(id: string): Promise<{ success: boolean }> {
    const res = await this.client.unregister(id);
    return { success: !!res.success };
  }

  async switchBridge(id: string): Promise<{ success: boolean }> {
    const res = await this.client.switch(id);
    return { success: !!res.success };
  }

  async getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null> {
    const cur = await this.client.get_current();
    if (!cur) {
      return null;
    }
    return { id: cur.id, config: cur.manifest as LlmManifest };
  }

  async listBridges(): Promise<BridgeSummary[]> {
    const list = await this.client.list();
    return list.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      language: item.language,
      configured: item.configured,
      available: item.available,
    }));
  }

  async getBridgeIds(): Promise<string[]> {
    const list = await this.listBridges();
    return list.map((x) => x.id);
  }

  async getBridgeConfig(id: string): Promise<LlmManifest | null> {
    const cfg = await this.client.get_config(id);
    return (cfg as LlmManifest) ?? null;
  }
}
