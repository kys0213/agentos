import { ServiceContainer } from '../services/ServiceContainer';
import type { BridgeService } from '../services/bridge-service';
import type { LlmBridgeConfig } from '../types/core-types';

/**
 * @deprecated BridgeManager는 더 이상 사용되지 않습니다.
 * 대신 ServiceContainer.get('bridge') 또는 Services.getBridge()를 사용하세요.
 *
 * 기존 코드와의 호환성을 위해 BridgeService로 위임하는 래퍼 클래스
 */
export class BridgeManager {
  private get bridgeService(): BridgeService {
    return ServiceContainer.get<BridgeService>('bridge');
  }

  /**
   * @deprecated bridgeService.register()를 직접 사용하세요
   */
  async register(id: string, config: LlmBridgeConfig): Promise<void> {
    console.warn('BridgeManager.register() is deprecated. Use bridgeService.register() instead.');
    const result = await this.bridgeService.register(id, config);
    if (!result.success) {
      throw new Error(`Failed to register bridge ${id}`);
    }
  }

  /**
   * @deprecated bridgeService.switchBridge()를 직접 사용하세요
   */
  async switchBridge(id: string): Promise<void> {
    console.warn(
      'BridgeManager.switchBridge() is deprecated. Use bridgeService.switchBridge() instead.'
    );
    const result = await this.bridgeService.switchBridge(id);
    if (!result.success) {
      throw new Error(`Bridge ${id} not registered`);
    }
  }

  /**
   * @deprecated bridgeService.getCurrentBridge()를 직접 사용하세요
   */
  async getCurrentBridge(): Promise<LlmBridgeConfig> {
    console.warn(
      'BridgeManager.getCurrentBridge() is deprecated. Use bridgeService.getCurrentBridge() instead.'
    );
    const current = await this.bridgeService.getCurrentBridge();
    if (!current) {
      throw new Error('No bridge selected');
    }
    // 기존 인터페이스 호환성을 위해 config만 반환
    return current.config;
  }

  /**
   * @deprecated bridgeService.getCurrentId()를 직접 사용하세요
   */
  async getCurrentId(): Promise<string | undefined> {
    console.warn(
      'BridgeManager.getCurrentId() is deprecated. Use bridgeService.getCurrentId() instead.'
    );
    return this.bridgeService.getCurrentId();
  }

  /**
   * @deprecated bridgeService.getBridgeIds()를 직접 사용하세요
   */
  async getBridgeIds(): Promise<string[]> {
    console.warn(
      'BridgeManager.getBridgeIds() is deprecated. Use bridgeService.getBridgeIds() instead.'
    );
    return this.bridgeService.getBridgeIds();
  }
}

// 호환성을 위한 기본 인스턴스 export
// 새로운 코드에서는 ServiceContainer나 Services 헬퍼를 사용할 것을 권장
export const bridgeManager = new BridgeManager();
