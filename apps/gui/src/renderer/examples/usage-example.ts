/**
 * IpcChannel 아키텍처 사용 예시
 * 새로운 아키텍처를 사용하는 방법을 보여주는 데모 코드
 */

// 방법 1: 자동 환경 감지를 통한 bootstrap
import { bootstrap, Services } from '../services';

// 애플리케이션 시작 시 bootstrap 실행
const { chatService, bridgeService, mcpService, presetService } = bootstrap();

console.log('🚀 Application bootstrapped successfully!');

// 방법 2: Services 헬퍼를 사용한 서비스 접근
async function exampleUsage() {
  try {
    // Chat 서비스 사용 예시
    console.log('=== Chat Service Example ===');
    const chatService = Services.getChat();

    const sessions = await chatService.listSessions();
    console.log('Existing sessions:', sessions.length);

    const newSession = await chatService.createSession({
      preset: {
        id: 'example-preset',
        name: 'Example Preset',
        description: 'Example preset for demo',
        author: 'Demo User',
        version: '1.0.0',
        systemPrompt: 'You are a helpful assistant.',
        llmBridgeName: 'example-bridge',
        llmBridgeConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Created new session:', newSession.id);

    // Bridge 서비스 사용 예시
    console.log('=== Bridge Service Example ===');
    const bridgeService = Services.getBridge();

    await bridgeService.register('demo-bridge', {
      name: 'Demo Bridge',
      type: 'custom',
      apiKey: 'demo-key',
    });

    const bridgeIds = await bridgeService.getBridgeIds();
    console.log('Available bridges:', bridgeIds);

    await bridgeService.switchBridge('demo-bridge');
    const currentBridge = await bridgeService.getCurrentBridge();
    console.log('Current bridge:', currentBridge?.id);

    // MCP 서비스 사용 예시
    console.log('=== MCP Service Example ===');
    const mcpService = Services.getMcp();

    await mcpService.connect({
      type: 'stdio',
      name: 'demo-mcp',
      version: '1.0.0',
      command: 'demo-command',
    });

    const mcpClients = await mcpService.getAll();
    console.log('Connected MCP clients:', mcpClients.length);

    // Preset 서비스 사용 예시
    console.log('=== Preset Service Example ===');
    const presetService = Services.getPreset();

    const presets = await presetService.getAll();
    console.log('Available presets:', presets.length);

    console.log('✅ All service examples completed successfully!');
  } catch (error) {
    console.error('❌ Error in example usage:', error);
  }
}

// React 컴포넌트에서 사용하는 예시
export function ExampleChatComponent() {
  // 방법 1: Services 헬퍼 사용
  const chatService = Services.getChat();
  const bridgeService = Services.getBridge();

  const handleSendMessage = async (message: string) => {
    try {
      // 현재 Bridge 확인
      const currentBridge = await bridgeService.getCurrentBridge();
      if (!currentBridge) {
        console.warn('No bridge selected');
        return;
      }

      // 세션 생성 및 메시지 전송
      const session = await chatService.createSession();
      const response = await chatService.sendMessage(session.id, message);

      console.log('Message sent successfully:', response);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return `
    Example Chat Component
    - Services are automatically injected based on environment
    - Works in Electron, Web, Chrome Extension, and Test environments
    - handleSendMessage: ${handleSendMessage.toString()}
  `;
}

// 실행 예시
if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 실행
  exampleUsage();

  // 전역에서 접근 가능하도록 설정 (디버깅용)
  (window as any).__exampleUsage = exampleUsage;
  (window as any).__Services = Services;
}

export { exampleUsage };
