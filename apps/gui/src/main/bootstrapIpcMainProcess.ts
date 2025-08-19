import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ElectronEventTransport } from './electron/transport/electron-event-transport';
import { IpcMain } from 'electron';

export async function bootstrapIpcMainProcess(ipcMain: IpcMain) {
  const appFrame = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronEventTransport(ipcMain),
  });

  await appFrame.listen();

  // return a composite closer compatible with main.ts
  return {
    close: async () => {
      await appFrame.close();
    },
  };
}
