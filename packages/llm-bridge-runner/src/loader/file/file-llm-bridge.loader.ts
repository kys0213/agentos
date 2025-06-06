import { pathToFileURL } from 'url';
import { LlmManifest } from 'llm-bridge-spec';

import { FileLlmBridgeLoader, LlmBridgeBootstrap } from '../types';
import { parseLlmBridgeConfig } from '../dependecy/parseLlmBridgeConfig';
import { DependencyLlmBridgeBootstrap } from '../dependecy/dependency-llm-bridge.bootstrap';
import { LlmBridgeConstructor } from '../dependecy/llm-bridge-constructor';

export class LocalFileLlmBridgeLoader implements FileLlmBridgeLoader {
  async load(moduleName: string): Promise<LlmBridgeBootstrap> {
    return this.loadFromPath(moduleName);
  }

  async loadFromPath(filePath: string): Promise<LlmBridgeBootstrap> {
    const loaded = await this.loadLlmBridgeFromPath(filePath);
    return new DependencyLlmBridgeBootstrap(loaded);
  }

  private async loadLlmBridgeFromPath(filePath: string): Promise<LoadedLlmBridge> {
    const mod = (await import(pathToFileURL(filePath).href)) as {
      manifest: () => LlmManifest;
      default: LlmBridgeConstructor<any[]>;
    };

    return {
      manifest: mod.manifest(),
      configSchema: parseLlmBridgeConfig(mod.manifest()),
      ctor: mod.default,
    };
  }
}

export type LoadedLlmBridge = {
  manifest: LlmManifest;
  configSchema: ReturnType<typeof parseLlmBridgeConfig>;
  ctor: LlmBridgeConstructor<any[]>;
};
