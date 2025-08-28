import type { RpcClient } from '../shared/rpc/transport';
import { AgentOsServiceNames } from '../shared/types/agentos-api';
import { ServiceContainer } from '../shared/di/service-container';
import { AgentClient as AgentService } from './rpc/gen/agent.client';
import { BridgeClient as BridgeService } from './rpc/gen/bridge.client';
import { ChatClient as ConversationService } from './rpc/gen/chat.client';
import { McpClient as McpService } from './rpc/gen/mcp.client';
import { PresetClient as PresetService } from './rpc/gen/preset.client';
import { McpUsageRpcService as McpUsageLogService } from './rpc/services/mcp-usage.service';

/**
 * Bootstrap 결과 타입
 */
export interface BootstrapResult {
  rpcTransport: RpcClient;
  bridgeService: BridgeService;
  mcpService: McpService;
  presetService: PresetService;
  agentService: AgentService;
  conversationService: ConversationService;
}

/**
 * 애플리케이션 Bootstrap 함수
 * IpcChannel을 주입받아 모든 서비스를 초기화하고 ServiceContainer에 등록
 */
export async function bootstrap(rpcTransport: RpcClient): Promise<BootstrapResult> {
  console.log('🚀 Starting application bootstrap...');

  // 모든 서비스에 동일한 IpcChannel 주입하여 생성
  // 새 RPC 서비스(Bridge/Preset/Agent)는 채널 기반 Transport를 사용
  const bridgeService = new BridgeService(rpcTransport);
  const mcpService = new McpService(rpcTransport);
  const presetService = new PresetService(rpcTransport);
  const agentService = new AgentService(rpcTransport);
  const conversationService = new ConversationService(rpcTransport);
  const mcpUsageLogService = new McpUsageLogService(rpcTransport);

  console.log('⚙️ All services created with IpcChannel dependency injection');

  // 서비스들을 ServiceContainer에 등록
  ServiceContainer.register('bridge', bridgeService);
  ServiceContainer.register('mcp', mcpService);
  ServiceContainer.register('preset', presetService);
  ServiceContainer.register('agent', agentService);
  ServiceContainer.register('mcpUsageLog', mcpUsageLogService);
  ServiceContainer.register('conversation', conversationService);

  console.log('📦 All services registered in ServiceContainer');
  console.log('✅ Bootstrap completed successfully');

  // 등록된 서비스 정보 로깅
  console.log('📋 Container info:', ServiceContainer.getInfo());

  // Optionally access window.electronBridge when wiring events

  return {
    rpcTransport,
    bridgeService,
    mcpService,
    presetService,
    agentService,
    conversationService,
  };
}

/**
 * Bootstrap이 완료되었는지 확인하는 함수
 */
export function isBootstrapped(): boolean {
  return AgentOsServiceNames.every((service) => ServiceContainer.has(service));
}

/**
 * 애플리케이션 종료 시 정리 작업
 */
export function shutdown(): void {
  console.log('🛑 Shutting down application...');
  ServiceContainer.clear();
  console.log('✅ Shutdown completed');
}
