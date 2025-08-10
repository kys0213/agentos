import type { IpcChannel, PresetProtocol } from '../../shared/types/ipc-channel';
import type { CreatePreset, Preset } from '@agentos/core';

/**
 * Preset 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class PresetService implements PresetProtocol {
  constructor(private ipcChannel: IpcChannel) {}

  getAllPresets(): Promise<Preset[]> {
    return this.ipcChannel.getAllPresets();
  }
  createPreset(preset: CreatePreset): Promise<Preset> {
    return this.ipcChannel.createPreset(preset);
  }
  updatePreset(id: string, preset: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    return this.ipcChannel.updatePreset(id, preset);
  }
  deletePreset(id: string): Promise<Preset> {
    return this.ipcChannel.deletePreset(id);
  }
  getPreset(id: string): Promise<Preset | null> {
    return this.ipcChannel.getPreset(id);
  }
}
