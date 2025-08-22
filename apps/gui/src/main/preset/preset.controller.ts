import type {
  CursorPaginationResult,
  Preset,
  PresetRepository,
  PresetSummary,
} from '@agentos/core';
import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PRESET_REPOSITORY_TOKEN } from '../common/preset/constants';
import { PresetCreateDto, UpdatePresetDto } from './dto/preset-upsert.dto';

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
    @Payload() createPreset: PresetCreateDto
  ): Promise<{ success: true; result: Preset } | { success: false; error: string }> {
    return this.safeZone(() => this.repo.create(createPreset));
  }

  @EventPattern('preset.update')
  async update(
    @Payload() data: UpdatePresetDto
  ): Promise<{ success: true; result: Preset } | { success: false; error: string }> {
    return this.safeZone(() => this.repo.update(data.id, data.preset));
  }

  @EventPattern('preset.delete')
  async remove(
    @Payload() id: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    return this.safeZone(() => this.repo.delete(id));
  }

  private async safeZone<T>(
    fn: () => Promise<T>
  ): Promise<{ success: true; result: T } | { success: false; error: string }> {
    try {
      return { success: true, result: await fn() };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
