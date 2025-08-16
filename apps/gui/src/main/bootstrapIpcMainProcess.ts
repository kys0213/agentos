import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ElectronEventTransport } from './transport/electron-event-transport';
import { BrowserWindow, IpcMain } from 'electron';

export async function bootstrapIpcMainProcess(ipcMain: IpcMain, mainWindow: BrowserWindow) {
  const appFrame = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronEventTransport(ipcMain, mainWindow),
  });

  await appFrame.listen();

  // return a composite closer compatible with main.ts
  return {
    close: async () => {
      await appFrame.close();
    },
  };
}
