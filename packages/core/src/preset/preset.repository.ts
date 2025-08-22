import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';
import { CreatePreset, Preset } from './preset';

/**
 * A lightweight summary of a preset.
 */
export interface PresetSummary {
  /** Internal unique identifier */
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
}

/**
 * Repository for managing presets.
 */
export interface PresetRepository {
  /**
   * Retrieve stored presets with cursor based pagination.
   */
  list(options?: CursorPagination): Promise<CursorPaginationResult<PresetSummary>>;

  /**
   * Get a preset by id.
   */
  get(id: string): Promise<Preset | null>;

  /**
   * Save a new preset.
   */
  create(preset: CreatePreset): Promise<Preset>;

  /**
   * Update an existing preset.
   */
  update(id: string, preset: Preset): Promise<Preset>;

  /**
   * Remove a preset.
   */
  delete(id: string): Promise<void>;
}
