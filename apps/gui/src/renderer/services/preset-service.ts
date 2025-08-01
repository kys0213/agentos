import type { IpcChannel } from './ipc/IpcChannel';
import type { Preset } from '../types/core-types';

/**
 * Preset 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class PresetService {
  constructor(private ipcChannel: IpcChannel) {}

  // ==================== 기본 Preset 메서드들 ====================

  async getAll(): Promise<Preset[]> {
    return this.ipcChannel.getAllPresets();
  }

  async create(preset: Preset): Promise<{ success: boolean }> {
    return this.ipcChannel.createPreset(preset);
  }

  async update(preset: Preset): Promise<{ success: boolean }> {
    return this.ipcChannel.updatePreset(preset);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    return this.ipcChannel.deletePreset(id);
  }

  async get(id: string): Promise<Preset | null> {
    return this.ipcChannel.getPreset(id);
  }

  // ==================== 편의 메서드들 ====================

  /**
   * 특정 이름의 프리셋이 존재하는지 확인
   */
  async existsByName(name: string): Promise<boolean> {
    const presets = await this.getAll();
    return presets.some((preset) => preset.name === name);
  }

  /**
   * 특정 작성자의 모든 프리셋 조회
   */
  async getAllByAuthor(author: string): Promise<Preset[]> {
    const presets = await this.getAll();
    return presets.filter((preset) => preset.author === author);
  }

  /**
   * 이름으로 프리셋 검색
   */
  async findByName(name: string): Promise<Preset | null> {
    const presets = await this.getAll();
    return presets.find((preset) => preset.name === name) || null;
  }

  /**
   * 특정 LLM Bridge를 사용하는 프리셋들 조회
   */
  async getAllByBridge(bridgeName: string): Promise<Preset[]> {
    const presets = await this.getAll();
    return presets.filter((preset) => preset.llmBridgeName === bridgeName);
  }

  /**
   * 프리셋 복제 (새로운 ID와 이름으로)
   */
  async duplicate(id: string, newName: string): Promise<{ success: boolean }> {
    const original = await this.get(id);
    if (!original) {
      return { success: false };
    }

    const duplicated: Preset = {
      ...original,
      id: `${original.id}-copy-${Date.now()}`,
      name: newName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.create(duplicated);
  }

  /**
   * 프리셋 수 반환
   */
  async getCount(): Promise<number> {
    const presets = await this.getAll();
    return presets.length;
  }
}
