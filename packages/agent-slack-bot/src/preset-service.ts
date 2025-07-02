import { PresetRepository, PresetSummary, Preset } from '@agentos/core';
import { ChannelPresetStore } from './channel-preset-store';

export class PresetService {
  constructor(
    private readonly repo: PresetRepository,
    private readonly channelStore: ChannelPresetStore
  ) {}

  async list(): Promise<PresetSummary[]> {
    const { items } = await this.repo.list();
    return items;
  }

  get(id: string): Promise<Preset | null> {
    return this.repo.get(id);
  }

  create(preset: Preset): Promise<void> {
    return this.repo.create(preset);
  }

  getActivePreset(channelId: string): Promise<string | null> {
    return this.channelStore.getPreset(channelId);
  }

  setActivePreset(channelId: string, presetId: string): Promise<void> {
    return this.channelStore.setPreset(channelId, presetId);
  }

  listChannelPresets() {
    return this.channelStore.listChannels();
  }
}
