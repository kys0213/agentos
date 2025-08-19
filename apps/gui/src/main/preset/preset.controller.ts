import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { Preset } from '@agentos/core';
import type { CursorPaginationResult } from '@agentos/core';
import type { PresetSummary, PresetRepository } from '@agentos/core';
import { PRESET_REPOSITORY_TOKEN } from '../common/preset/constants';
import { PresetUpsertDto, UpdatePresetDto } from './dto/preset-upsert.dto';

@Controller()
export class PresetController {
  constructor(@Inject(PRESET_REPOSITORY_TOKEN) private readonly repo: PresetRepository) {}

  @EventPattern('preset.list')
  async list(): Promise<CursorPaginationResult<PresetSummary>> {
    return this.repo.list();
  }

  @EventPattern('preset.get')
  async get(@Payload() id: string): Promise<Preset | null> {
    return this.repo.get(id);
  }

  @EventPattern('preset.create')
  async create(
    @Payload() preset: PresetUpsertDto
  ): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.repo.create(preset as unknown as Preset);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }

  @EventPattern('preset.update')
  async update(
    @Payload() data: UpdatePresetDto
  ): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.repo.update(data.id, data.preset as unknown as Preset);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }

  @EventPattern('preset.delete')
  async remove(@Payload() id: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await this.repo.delete(id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }
}
