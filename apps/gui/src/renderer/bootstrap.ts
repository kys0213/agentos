import type { IpcChannel } from '../shared/types/ipc-channel';
import { createIpcChannel } from './services/ipc/IpcChannelFactory';
import { ServiceContainer } from './services/service-container';
import { BridgeService } from './services/bridge.service';
import { McpService } from './services/mcp-service';
import { PresetService } from './services/preset-service';
import { AgentService } from './services/agent.service';
import { AgentOsServiceName, AgentOsServiceNames } from '../shared/types/agentos-api';
import { McpUsageLogService } from './services/mcp-usage.service';
import { BuiltinToolService } from './services/builtin-tool.service';

/**
 * Bootstrap 결과 타입
 */
export interface BootstrapResult {
  ipcChannel: IpcChannel;
  bridgeService: BridgeService;
  mcpService: McpService;
  presetService: PresetService;
  agentService: AgentService;
}

/**
 * 애플리케이션 Bootstrap 함수
 * IpcChannel을 주입받아 모든 서비스를 초기화하고 ServiceContainer에 등록
 */
export function bootstrap(ipcChannel?: IpcChannel): BootstrapResult {
  console.log('🚀 Starting application bootstrap...');

  // IpcChannel 생성 또는 주입받은 것 사용
  const channel = ipcChannel || createIpcChannel();
  console.log('📡 IpcChannel created/injected');

  // 모든 서비스에 동일한 IpcChannel 주입하여 생성
  const bridgeService = new BridgeService(channel);
  const mcpService = new McpService(channel);
  const presetService = new PresetService(channel);
  const agentService = new AgentService(channel);
  const builtinToolService = new BuiltinToolService(channel);
  const mcpUsageLogService = new McpUsageLogService(channel);

  console.log('⚙️ All services created with IpcChannel dependency injection');

  // 서비스들을 ServiceContainer에 등록
  ServiceContainer.register('bridge', bridgeService);
  ServiceContainer.register('mcp', mcpService);
  ServiceContainer.register('preset', presetService);
  ServiceContainer.register('agent', agentService);
  ServiceContainer.register('builtinTool', builtinToolService);
  ServiceContainer.register('mcpUsageLog', mcpUsageLogService);

  console.log('📦 All services registered in ServiceContainer');
  console.log('✅ Bootstrap completed successfully');

  // 등록된 서비스 정보 로깅
  console.log('📋 Container info:', ServiceContainer.getInfo());

  return {
    ipcChannel: channel,
    bridgeService,
    mcpService,
    presetService,
    agentService,
  };
}

/**
 * 서비스 컨테이너에서 서비스를 가져오는 헬퍼 함수들
 * 컴포넌트에서 쉽게 서비스에 접근할 수 있도록 제공
 */
export const Services = {
  getBridge: (): BridgeService => ServiceContainer.get<BridgeService>('bridge'),
  getMcp: (): McpService => ServiceContainer.get<McpService>('mcp'),
  getPreset: (): PresetService => ServiceContainer.get<PresetService>('preset'),
  getAgent: (): AgentService => ServiceContainer.get<AgentService>('agent'),
  getBuiltinTool: (): BuiltinToolService => ServiceContainer.get<BuiltinToolService>('builtinTool'),
  getMcpUsageLog: (): McpUsageLogService => ServiceContainer.get<McpUsageLogService>('mcpUsageLog'),
} as const;

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
