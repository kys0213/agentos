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
        const mod = await import(
          'llm-bridge-loader/dist/esm/dependency/dependency-bridge.loader.js'
        );
        const LoaderCtor = (mod as { DependencyBridgeLoader: new () => unknown })
          .DependencyBridgeLoader;
        return new FileBasedLlmBridgeRegistry(
          path.join(env.userDataPath, 'bridges'),
          new LoaderCtor() as any
        );
      },
    },
  ],
  exports: [LLM_BRIDGE_REGISTRY_TOKEN],
})
export class LlmBridgeModule {}
