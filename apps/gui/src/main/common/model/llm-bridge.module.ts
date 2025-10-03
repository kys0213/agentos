import { FileBasedLlmBridgeRegistry } from '@agentos/core';
import { Module } from '@nestjs/common';
import { DependencyBridgeLoader } from 'llm-bridge-loader';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import { LLM_BRIDGE_REGISTRY_TOKEN } from './constants';

@Module({
  providers: [
    {
      provide: LLM_BRIDGE_REGISTRY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: async (env: ElectronAppEnvironment) => {
        const loader = new DependencyBridgeLoader();

        return new FileBasedLlmBridgeRegistry(env.userDataPath, loader);
      },
    },
  ],
  exports: [LLM_BRIDGE_REGISTRY_TOKEN],
})
export class LlmBridgeModule {}
