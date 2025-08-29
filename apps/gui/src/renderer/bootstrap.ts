import type { RpcClient } from '../shared/rpc/transport';
import { AgentOsServiceNames } from '../shared/types/agentos-api';
import { ServiceContainer } from '../shared/di/service-container';
import { AgentClient as AgentService } from './rpc/gen/agent.client';
import { ChatClient as ConversationService } from './rpc/gen/chat.client';
import { McpClient as McpService } from './rpc/gen/mcp.client';
import { PresetClient } from './rpc/gen/preset.client';
import { BridgeClient } from './rpc/gen/bridge.client';
import { PresetServiceAdapter } from './rpc/adapters/preset.adapter';
import { BridgeServiceAdapter } from './rpc/adapters/bridge.adapter';
import { AgentServiceAdapter } from './rpc/adapters/agent.adapter';
import { ConversationServiceAdapter } from './rpc/adapters/conversation.adapter';
import { McpServiceAdapter } from './rpc/adapters/mcp.adapter';
import { McpUsageRpcService as McpUsageLogService } from './rpc/services/mcp-usage.service';

/**
 * Bootstrap 결과 타입
 */
export interface BootstrapResult {
  rpcTransport: RpcClient;
  bridgeService: BridgeServiceAdapter;
  mcpService: McpServiceAdapter;
  presetService: PresetServiceAdapter;
  agentService: AgentServiceAdapter;
  conversationService: ConversationServiceAdapter;
}

/**
 * 애플리케이션 Bootstrap 함수
 * RpcClient를 주입받아 모든 서비스를 초기화하고 ServiceContainer에 등록
 */
export async function bootstrap(rpcTransport: RpcClient): Promise<BootstrapResult> {
  console.log('🚀 Starting application bootstrap...');

  // 공통 RpcClient(Transport)로 생성된 클라이언트를 주입
  // 새 RPC 서비스(Bridge/Preset/Agent)는 채널 기반 Transport를 사용
  const bridgeService = new BridgeServiceAdapter(new BridgeClient(rpcTransport));
  const mcpService = new McpServiceAdapter(new McpService(rpcTransport));
  const presetService = new PresetServiceAdapter(new PresetClient(rpcTransport));
  const agentService = new AgentServiceAdapter(new AgentService(rpcTransport));
  const conversationService = new ConversationServiceAdapter(new ConversationService(rpcTransport));
  const mcpUsageLogService = new McpUsageLogService(rpcTransport);

  console.log('⚙️ All services created with Rpc transport dependency injection');

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
