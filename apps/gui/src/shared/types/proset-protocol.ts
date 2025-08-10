import type { Preset, CreatePreset } from '@agentos/core';

export interface PresetProtocol {
  /**
   * 모든 프리셋 조회
   */
  getAllPresets(): Promise<Preset[]>;

  /**
   * 프리셋 생성
   */
  createPreset(preset: CreatePreset): Promise<Preset>;

  /**
   * 프리셋 업데이트
   */
  updatePreset(id: string, preset: Partial<Omit<Preset, 'id'>>): Promise<Preset>;

  /**
   * 프리셋 삭제
   */
  deletePreset(id: string): Promise<Preset>;

  /**
   * 특정 프리셋 조회
   */
  getPreset(id: string): Promise<Preset | null>;
}
