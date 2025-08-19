import { Module } from '@nestjs/common';
import { LLM_BRIDGE_REGISTRY_TOKEN } from './constants';
import { FileBasedLlmBridgeRegistry } from '@agentos/core';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import { DependencyBridgeLoader } from 'llm-bridge-loader';
import * as path from 'path';

@Module({
  providers: [
    {
      provide: LLM_BRIDGE_REGISTRY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment) => {
        return new FileBasedLlmBridgeRegistry(
          path.join(env.userDataPath, 'bridges'),
          new DependencyBridgeLoader()
        );
      },
    },
  ],
  exports: [LLM_BRIDGE_REGISTRY_TOKEN],
})
export class LlmBridgeModule {}
