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

  // IpcChannel 인터페이스에 맞춘 Preset 핸들러들

  // getAllPresets
  ipcMain.handle('preset:get-all', async (_event: IpcMainInvokeEvent) => {
    try {
      const presets = await repository.list();
      return presets;
    } catch (error) {
      console.error('Failed to get presets:', error);
      throw error;
    }
  });

  // createPreset
  ipcMain.handle('preset:create', async (_event: IpcMainInvokeEvent, preset: any) => {
    try {
      await repository.create(preset);
      return { success: true };
    } catch (error) {
      console.error('Failed to create preset:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // updatePreset
  ipcMain.handle('preset:update', async (_event: IpcMainInvokeEvent, preset: any) => {
    try {
      // TODO: repository.update 메서드가 없다면 추가하거나 다른 방식으로 구현
      // 지금은 임시로 create를 사용
      await repository.create(preset);
      return { success: true };
    } catch (error) {
      console.error('Failed to update preset:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // deletePreset
  ipcMain.handle('preset:delete', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
      await repository.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete preset:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // getPreset
  ipcMain.handle('preset:get', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
      // TODO: repository.get 메서드가 없다면 추가하거나 list에서 찾기
      const presets = await repository.list();
      const preset = presets.items.find((p) => p.id === id);
      return preset || null;
    } catch (error) {
      console.error('Failed to get preset:', error);
      throw error;
    }
  });
}
