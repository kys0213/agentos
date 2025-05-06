import { LlmBridge, LlmManifest } from 'llm-bridge-spec';
import { z } from 'zod';
import { LlmBridgeBootstrap } from '../types';
import { LoadedLlmBridge } from './dependency-llm-bridge.loader';

export class DependencyLlmBridgeBootstrap implements LlmBridgeBootstrap {
  constructor(private readonly loadedLlmBridge: LoadedLlmBridge) {}

  get manifest(): LlmManifest {
    return this.loadedLlmBridge.manifest;
  }

  get configSchema(): z.AnyZodObject {
    return this.loadedLlmBridge.configSchema;
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    const result = this.configSchema.safeParse(config);

    return result.success;
  }

  async create(config: Record<string, any>): Promise<LlmBridge> {
    return new this.loadedLlmBridge.ctor(config);
  }
}
