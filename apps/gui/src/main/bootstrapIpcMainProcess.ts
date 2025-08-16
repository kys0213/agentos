import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { IpcMain } from 'electron';
import { AppModule } from './app.module';
import { ElectronTransport } from './transport/electron-transport';
import { ElectronEventTransport } from './transport/electron-event-transport';

export async function bootstrapIpcMainProcess(ipcMain: IpcMain) {
  const appInvoke = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronTransport(ipcMain),
  });

  const appFrame = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronEventTransport(),
  });

  await Promise.all([appInvoke.listen(), appFrame.listen()]);

  // return a composite closer compatible with main.ts
  return {
    close: async () => {
      await Promise.all([appFrame.close(), appInvoke.close()]);
    },
  } as unknown as { close: () => Promise<void> };
}
