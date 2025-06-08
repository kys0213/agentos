import { LlmBridge } from 'llm-bridge-spec';

export class BridgeManager {
  private bridges = new Map<string, LlmBridge>();
  private currentId?: string;

  register(id: string, bridge: LlmBridge): void {
    this.bridges.set(id, bridge);
    if (!this.currentId) {
      this.currentId = id;
    }
  }

  async switchBridge(id: string): Promise<void> {
    if (!this.bridges.has(id)) {
      throw new Error(`Bridge ${id} not registered`);
    }
    this.currentId = id;
  }

  getCurrentBridge(): LlmBridge {
    if (!this.currentId) {
      throw new Error('No bridge selected');
    }
    return this.bridges.get(this.currentId)!;
  }

  getCurrentId(): string | undefined {
    return this.currentId;
  }

  getBridgeIds(): string[] {
    return Array.from(this.bridges.keys());
  }
}
