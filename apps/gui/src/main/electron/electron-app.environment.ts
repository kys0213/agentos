import { Injectable } from '@nestjs/common';
import { App } from 'electron';
import { InjectElectronApp } from './constants';

@Injectable()
export class ElectronAppEnvironment {
  constructor(@InjectElectronApp() private readonly app: App) {}

  get userDataPath() {
    return this.app.getPath('userData');
  }

  get name() {
    return this.app.getName();
  }

  get version() {
    return this.app.getVersion();
  }
}
