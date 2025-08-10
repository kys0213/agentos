import { LlmManifest } from 'llm-bridge-spec';

export interface LlmBridgeProtocol {
  /**
   * LLM Bridge 등록
   */
  registerBridge(config: LlmManifest): Promise<{ success: boolean }>;

  /**
   * LLM Bridge 등록 해제
   */
  unregisterBridge(id: string): Promise<{ success: boolean }>;

  /**
   * 활성 Bridge 전환
   */
  switchBridge(id: string): Promise<{ success: boolean }>;

  /**
   * 현재 활성 Bridge 정보 조회
   */
  getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null>;

  /**
   * 등록된 모든 Bridge ID 목록 조회
   */
  getBridgeIds(): Promise<string[]>;

  /**
   * 특정 Bridge 설정 조회
   */
  getBridgeConfig(id: string): Promise<LlmManifest | null>;
}
