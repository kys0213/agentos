import { LlmManifest } from 'llm-bridge-spec';
import { z } from 'zod';
import { LlmBridgeConstructor } from './llm-bridge-constructor';
import { parseLlmBridgeConfig } from './parseLlmBridgeConfig';
import { LlmBridgeBootstrap, LlmBridgeLoader } from '../types';
import { DependencyLlmBridgeBootstrap } from './dependency-llm-bridge.bootstrap';

export class DependencyLlmBridgeLoader implements LlmBridgeLoader {
  async load(moduleName: string): Promise<LlmBridgeBootstrap> {
    const loaded = await this.loadLlmBridge(moduleName);

    return new DependencyLlmBridgeBootstrap(loaded);
  }

  private async loadLlmBridge(moduleName: string): Promise<LoadedLlmBridge> {
    const bridge = (await import(`${moduleName}`)) as {
      manifest: () => LlmManifest;
      default: LlmBridgeConstructor<any[]>;
    };

    return {
      manifest: bridge.manifest(),
      configSchema: parseLlmBridgeConfig(bridge.manifest()),
      ctor: bridge.default,
    };
  }
}

export type LoadedLlmBridge = {
  manifest: LlmManifest;
  configSchema: z.AnyZodObject;
  ctor: LlmBridgeConstructor<any[]>;
};
