import { LlmBridge, LlmMetadata } from 'llm-bridge-spec';

export interface LlmBridgeRegistry {
  register(moduleName: string, llmBridge: LlmBridge): Promise<void>;
  unregister(moduleName: string): Promise<void>;
  getBridge(moduleName: string): Promise<LlmBridge | undefined>;
  getBridgeOrThrow(moduleName: string): Promise<LlmBridge>;
  getRegistredModuleNames(): Promise<string[]>;
  getAllBridges(): Promise<LlmBridge[]>;
  getMetadata(moduleName: string): Promise<LlmMetadata>;
  getAllMetadata(): Promise<LlmMetadata[]>;
}
