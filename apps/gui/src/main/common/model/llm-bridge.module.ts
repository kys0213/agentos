import { Module } from '@nestjs/common';
import { LLM_BRIDGE_REGISTRY_TOKEN } from './constants';
import { FileBasedLlmBridgeRegistry } from '@agentos/core';
import type { LlmBridgeLoader, BridgeLoadResult } from 'llm-bridge-loader';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
// Note: llm-bridge-loader package does not re-export DependencyBridgeLoader at root in our version.
// Dynamically import concrete ESM path in factory to avoid resolution issues.
import * as path from 'path';

@Module({
  providers: [
    {
      provide: LLM_BRIDGE_REGISTRY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: async (env: ElectronAppEnvironment) => {
        let loader: LlmBridgeLoader;
        try {
          const mod = await import(
            'llm-bridge-loader/dist/esm/dependency/dependency-bridge.loader.js'
          );
          loader = new (
            mod as { DependencyBridgeLoader: new () => LlmBridgeLoader }
          ).DependencyBridgeLoader();
        } catch {
          class NoopBridgeLoader implements LlmBridgeLoader {
            async load(_name: string): Promise<BridgeLoadResult> {
              throw new Error('DependencyBridgeLoader not available in this build');
            }
          }
          loader = new NoopBridgeLoader();
        }

        return new FileBasedLlmBridgeRegistry(path.join(env.userDataPath, 'bridges'), loader);
      },
    },
  ],
  exports: [LLM_BRIDGE_REGISTRY_TOKEN],
})
export class LlmBridgeModule {}
