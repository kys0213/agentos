import { LlmBridge, LlmManifest } from 'llm-bridge-spec';

export interface LlmBridgeLoader {
  load(moduleName: string): Promise<LlmBridgeBootstrap>;
}

export interface LlmBridgeBootstrap {
  manifest: LlmManifest;

  validateConfig<T extends Record<string, any>>(config: T): Promise<boolean>;

  create<T extends Record<string, any>>(config: T): Promise<LlmBridge>;
}
