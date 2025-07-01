import { PresetRepository, PresetSummary, Preset } from '@agentos/core';

export class PresetService {
  constructor(private repo: PresetRepository) {}

  async list(): Promise<PresetSummary[]> {
    const { items } = await this.repo.list();
    return items;
  }

  get(id: string): Promise<Preset | null> {
    return this.repo.get(id);
  }
}
