import { LlmBridgeConfig } from '../types/core-types';
import type { IpcChannel } from './ipc/IpcChannel';

/**
 * Bridge 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class BridgeService {
  constructor(private ipcChannel: IpcChannel) {}

  // ==================== Bridge 관리 메서드들 ====================

  async register(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }> {
    return this.ipcChannel.registerBridge(id, config);
  }

  async unregister(id: string): Promise<{ success: boolean }> {
    return this.ipcChannel.unregisterBridge(id);
  }

  async switchBridge(id: string): Promise<{ success: boolean }> {
    return this.ipcChannel.switchBridge(id);
  }

  async getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null> {
    return this.ipcChannel.getCurrentBridge();
  }

  async getBridgeIds(): Promise<string[]> {
    return this.ipcChannel.getBridgeIds();
  }

  async getBridgeConfig(id: string): Promise<LlmBridgeConfig | null> {
    return this.ipcChannel.getBridgeConfig(id);
  }

  // ==================== 편의 메서드들 ====================

  /**
   * 현재 활성 Bridge ID를 반환
   */
  async getCurrentId(): Promise<string | undefined> {
    const current = await this.getCurrentBridge();
    return current?.id;
  }

  /**
   * 특정 Bridge가 등록되어 있는지 확인
   */
  async isRegistered(id: string): Promise<boolean> {
    const ids = await this.getBridgeIds();
    return ids.includes(id);
  }

  /**
   * 등록된 Bridge 수 반환
   */
  async getCount(): Promise<number> {
    const ids = await this.getBridgeIds();
    return ids.length;
  }

  /**
   * 현재 Bridge가 있는지 확인
   */
  async hasCurrentBridge(): Promise<boolean> {
    const current = await this.getCurrentBridge();
    return current !== null;
  }
}
