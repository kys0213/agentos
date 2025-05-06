import { LlmBridge, LlmMetadata } from 'llm-bridge-spec';
import { LlmBridgeRegistry } from '../types';

export class InMemoryLlmBridgeRegistry implements LlmBridgeRegistry {
  private readonly llmBridges: Map<string, LlmBridge> = new Map();

  getBridge(moduleName: string): Promise<LlmBridge | undefined> {
    return Promise.resolve(this.llmBridges.get(moduleName));
  }

  async getBridgeOrThrow(moduleName: string): Promise<LlmBridge> {
    const bridge = await this.getBridge(moduleName);

    if (!bridge) {
      throw new Error(`LlmBridge ${moduleName} not found`);
    }

    return bridge;
  }

  getAllBridges(): Promise<LlmBridge[]> {
    return Promise.resolve(Array.from(this.llmBridges.values()));
  }

  async getMetadata(moduleName: string): Promise<LlmMetadata> {
    const bridge = await this.getBridgeOrThrow(moduleName);

    return bridge.getMetadata();
  }

  async getAllMetadata(): Promise<LlmMetadata[]> {
    const bridges = await this.getAllBridges();

    const metadatas = await Promise.all(bridges.map((bridge) => bridge.getMetadata()));

    return metadatas;
  }

  getRegistredModuleNames(): Promise<string[]> {
    return Promise.resolve(Array.from(this.llmBridges.keys()));
  }

  async register(moduleName: string, llmBridge: LlmBridge): Promise<void> {
    this.llmBridges.set(moduleName, llmBridge);
  }

  async unregister(moduleName: string): Promise<void> {
    this.llmBridges.delete(moduleName);
  }
}
