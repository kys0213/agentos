import { Global, Module } from '@nestjs/common';
import { app } from 'electron';
import { ELECTRON_APP_TOKEN } from './constants';
import { ElectronAppEnvironment } from './electron-app.environment';

@Module({
  providers: [{ provide: ELECTRON_APP_TOKEN, useValue: app }, ElectronAppEnvironment],
  exports: [ELECTRON_APP_TOKEN, ElectronAppEnvironment],
})
@Global()
export class ElectronAppModule {}
