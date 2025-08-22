import type { CreatePreset, Preset } from '@agentos/core';
import type { PresetProtocol } from '../../shared/types/proset-protocol';
import { ServiceContainer } from '../ipc/service-container';

// IPC 기반 프리셋 스토어 (브라우저 호환)
export class PresetStore {
  private get presetService(): PresetProtocol {
    return ServiceContainer.getOrThrow('preset');
  }

  async list(): Promise<Preset[]> {
    return await this.presetService.getAllPresets();
  }

  async save(preset: Preset): Promise<void> {
    // ID가 있으면 업데이트, 없으면 생성
    if (await this.exists(preset.id)) {
      const { id: _id, ...patch } = preset;
      await this.presetService.updatePreset(preset.id, patch);
    } else {
      const createData: CreatePreset = {
        name: preset.name,
        description: preset.description,
        author: preset.author,
        version: preset.version,
        systemPrompt: preset.systemPrompt,
        enabledMcps: preset.enabledMcps,
        llmBridgeName: preset.llmBridgeName,
        llmBridgeConfig: preset.llmBridgeConfig,
        status: preset.status,
        category: preset.category,
      };
      await this.presetService.createPreset(createData);
    }
  }

  async delete(id: string): Promise<void> {
    await this.presetService.deletePreset(id);
  }

  private async exists(id: string): Promise<boolean> {
    const presets = await this.list();
    return presets.some((p) => p.id === id);
  }
}
