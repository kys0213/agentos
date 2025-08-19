import { Inject } from '@nestjs/common';

export const ELECTRON_APP_TOKEN = Symbol('ELECTRON_APP');

export const InjectElectronApp = () => Inject(ELECTRON_APP_TOKEN);
