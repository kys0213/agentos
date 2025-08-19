import { Module } from '@nestjs/common';
import { LLM_BRIDGE_REGISTRY_TOKEN } from './constants';
import { FileBasedLlmBridgeRegistry } from '@agentos/core';
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
        let loader: unknown;
        try {
          const mod = await import(
            'llm-bridge-loader/dist/esm/dependency/dependency-bridge.loader.js'
          );
          loader = new (mod as { DependencyBridgeLoader: new () => unknown })
            .DependencyBridgeLoader();
        } catch {
          class NoopBridgeLoader {
            async load() {
              throw new Error('DependencyBridgeLoader not available in this build');
            }
          }
          loader = new NoopBridgeLoader();
        }

        return new FileBasedLlmBridgeRegistry(
          path.join(env.userDataPath, 'bridges'),
          loader as any
        );
      },
    },
  ],
  exports: [LLM_BRIDGE_REGISTRY_TOKEN],
})
export class LlmBridgeModule {}
