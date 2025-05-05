import { LlmBridge } from 'llm-bridge-spec';

export class LlmBridgeManager {
  private llmBridges: Map<string, LlmBridge> = new Map();

  async enable(llmBridge: LlmBridge): Promise<void> {
    const metadata = await llmBridge.getMetadata();
    this.llmBridges.set(`${metadata.name}-${metadata.model}-${metadata.version}`, llmBridge);
  }

  async disable(llmBridge: LlmBridge): Promise<void> {
    const metadata = await llmBridge.getMetadata();
    this.llmBridges.delete(`${metadata.name}-${metadata.model}-${metadata.version}`);
  }

  async get(moduleName: string): Promise<LlmBridge | undefined> {
    return this.llmBridges.get(id);
  }
}
