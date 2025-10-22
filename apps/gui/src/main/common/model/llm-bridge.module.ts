import { FileBasedLlmBridgeRegistry } from '@agentos/core';
import { Module } from '@nestjs/common';
import { DependencyBridgeLoader } from 'llm-bridge-loader';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import { LLM_BRIDGE_REGISTRY_TOKEN } from './constants';
import { loadBundledBridges } from './load-bundled-bridges';

@Module({
  providers: [
    {
      provide: LLM_BRIDGE_REGISTRY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: async (env: ElectronAppEnvironment) => {
        const loader = new DependencyBridgeLoader();
        const registry = new FileBasedLlmBridgeRegistry(env.userDataPath, loader);

        const scanRoot = env.appPath ?? '.';
        await loadBundledBridges(registry, loader, scanRoot);

        return registry;
      },
    },
  ],
  exports: [LLM_BRIDGE_REGISTRY_TOKEN],
})
export class LlmBridgeModule {}
