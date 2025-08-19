import { Module } from '@nestjs/common';
import * as path from 'path';
import { FileBasedPresetRepository } from '@agentos/core';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import { PRESET_REPOSITORY_TOKEN } from './constants';

@Module({
  providers: [
    {
      provide: PRESET_REPOSITORY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment) => {
        return new FileBasedPresetRepository(path.join(env.userDataPath, 'presets'));
      },
    },
  ],
  exports: [PRESET_REPOSITORY_TOKEN],
})
export class PresetModule {}
