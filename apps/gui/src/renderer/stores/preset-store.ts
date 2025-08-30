import type { CreatePreset, Preset } from '@agentos/core';
import { ServiceContainer } from '../../shared/di/service-container';

// RPC 기반 프리셋 스토어 (브라우저 호환)
// ServiceContainer에 주입된 generated RPC client를 통해 동작합니다.
export class PresetStore {
  private get presetService() {
    return ServiceContainer.getOrThrow('preset');
  }

  async list(): Promise<Preset[]> {
    return await this.presetService.getAllPresets();
  }

  async save(preset: Preset): Promise<void> {
    // ID가 있으면 업데이트, 없으면 생성
    if (await this.exists(preset.id)) {
      const { id, ...patch } = preset;
      await this.presetService.updatePreset(id, patch);
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
