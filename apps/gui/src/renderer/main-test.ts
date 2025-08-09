/**
 * 테스트 환경 진입점
 * MockIpcChannel을 사용하여 bootstrap 실행
 */
import { bootstrap } from './bootstrap';
import { MockIpcChannel } from './services/ipc/MockIpcChannel';

console.log('🧪 Starting test environment...');

// 테스트 환경에서는 MockIpcChannel을 명시적으로 사용
const ipcChannel = new MockIpcChannel();

// Bootstrap 실행
const services = bootstrap(ipcChannel);

console.log('🧪 Test environment ready with services:', Object.keys(services));

// 테스트용 헬퍼 함수들
export const testHelpers = {
  /**
   * 새로운 MockIpcChannel로 다시 bootstrap
   */
  resetServices: () => {
    const newChannel = new MockIpcChannel();
    return bootstrap(newChannel);
  },

  /**
   * 현재 Mock 데이터 상태 확인
   */
  getMockData: () => {
    if (ipcChannel instanceof MockIpcChannel) {
      return {
        // MockIpcChannel의 private 데이터에 접근하기 위한 public 메서드가 필요할 수 있음
        // 지금은 기본 구조만 제공
        message: 'Mock data access would need additional methods in MockIpcChannel',
      };
    }
    return null;
  },

  /**
   * 테스트용 데이터 주입
   */
  setupTestData: async () => {
    // 테스트용 기본 데이터 생성
    await services.chatService.createSession({
      preset: {
        id: 'test-preset',
        name: 'Test Preset',
        description: 'Test preset for unit tests',
        author: 'Test',
        version: '1.0.0',
        systemPrompt: 'Test system prompt',
        llmBridgeName: 'test-bridge',
        llmBridgeConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        usageCount: 0,
        knowledgeDocuments: 0,
        knowledgeStats: {
          indexed: 0,
          vectorized: 0,
          totalSize: 0,
        },
        category: ['general'],
      },
    });

    await services.bridgeService.register('test-bridge', {
      name: 'Test Bridge',
      type: 'custom',
    });

    console.log('🧪 Test data setup completed');
  },
};

export default services;
