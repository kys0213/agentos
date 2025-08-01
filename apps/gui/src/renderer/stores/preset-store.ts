import type { Preset } from '../types/core-types';
import { PresetService } from '../services/preset-service';
import { Services } from '../bootstrap';

// IPC 기반 프리셋 스토어 (브라우저 호환)
export class PresetStore {
  private get presetService(): PresetService {
    return Services.getPreset();
  }

  async list(): Promise<Preset[]> {
    return await this.presetService.getAll();
  }

  async save(preset: Preset): Promise<void> {
    // ID가 있으면 업데이트, 없으면 생성
    if (await this.exists(preset.id)) {
      await this.presetService.update(preset);
    } else {
      await this.presetService.create(preset);
    }
  }

  async delete(id: string): Promise<void> {
    await this.presetService.delete(id);
  }

  private async exists(id: string): Promise<boolean> {
    const presets = await this.list();
    return presets.some((p) => p.id === id);
  }
}

// 기존 함수들을 async로 업데이트
export async function loadPresets(store: PresetStore): Promise<Preset[]> {
  return store.list();
}

export async function savePreset(store: PresetStore, preset: Preset): Promise<void> {
  return store.save(preset);
}

export async function deletePreset(store: PresetStore, id: string): Promise<void> {
  return store.delete(id);
}
