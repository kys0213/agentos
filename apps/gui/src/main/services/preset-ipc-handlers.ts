import { ipcMain, IpcMainInvokeEvent, app } from 'electron';
import { PresetRepository, FileBasedPresetRepository } from '@agentos/core';
import * as path from 'path';

let presetRepository: PresetRepository | null = null;

function initializePresetRepository(): PresetRepository {
  if (presetRepository) return presetRepository;

  const userDataPath = app.getPath('userData');
  const presetsPath = path.join(userDataPath, 'presets');
  
  presetRepository = new FileBasedPresetRepository(presetsPath);
  
  console.log('Preset repository initialized');
  return presetRepository;
}

export function setupPresetIpcHandlers() {
  const repository = initializePresetRepository();
  // Preset handlers
  ipcMain.handle('preset:get-all', async (_event: IpcMainInvokeEvent) => {
    try {
      const presets = await repository.list();
      return presets;
    } catch (error) {
      console.error('Failed to get presets:', error);
      throw error;
    }
  });

  ipcMain.handle('preset:save', async (_event: IpcMainInvokeEvent, preset: any) => {
    try {
      await repository.create(preset);
      return { success: true };
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw error;
    }
  });

  ipcMain.handle('preset:delete', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
      await repository.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw error;
    }
  });
}