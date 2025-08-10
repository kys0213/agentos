import { LlmManifest } from 'llm-bridge-spec';

export class LlmBridgeStore {
  private bridges: LlmManifest[] = [];

  list(): LlmManifest[] {
    return [...this.bridges];
  }

  save(config: LlmManifest): void {
    const index = this.bridges.findIndex((b) => b.name === config.name);
    if (index >= 0) {
      this.bridges[index] = config;
    } else {
      this.bridges.push(config);
    }
  }

  delete(id: string): void {
    this.bridges = this.bridges.filter((b) => b.name !== id);
  }
}
