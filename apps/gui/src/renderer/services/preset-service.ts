import type { PresetAPI } from '../../shared/types/electron-api';

// IPC 기반 프리셋 서비스 클라이언트
export class PresetService {
  private get api(): PresetAPI {
    return window.electronAPI.preset;
  }

  async getAll() {
    return this.api.getAll();
  }

  async create(preset: any) {
    return this.api.create(preset);
  }

  async update(preset: any) {
    return this.api.update(preset);
  }

  async delete(id: string) {
    return this.api.delete(id);
  }
}

export const presetService = new PresetService();