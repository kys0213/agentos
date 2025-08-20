import { SimpleEventEmitter } from '../../../common/event/simple-event-emitter';
import type { McpToolMetadata, McpConnectionStatus } from '../mcp-types';
import type { McpConfig } from '../mcp-config';
import type { McpToolRepository, McpToolSearchQuery } from '../repository/mcp-tool-repository';
import type {
  McpMetadataRegistry,
  McpMetadataRegistryEvents,
} from '../registry/mcp-metadata-registry';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../../common/pagination/cursor-pagination';

/**
 * MCP 서비스 이벤트 타입
 */
export type McpServiceEvents = McpMetadataRegistryEvents & {
  /** 서비스가 초기화되었을 때 */
  serviceInitialized: { totalTools: number };
  /** 도구 작업이 시작되었을 때 */
  operationStarted: { operation: string; toolId?: string };
  /** 도구 작업이 완료되었을 때 */
  operationCompleted: { operation: string; toolId?: string; success: boolean };
} & Record<string, unknown>;

/**
 * MCP 도구 관리를 위한 통합 서비스 Facade
 *
 * 이 클래스는 Repository와 Registry를 조합하여 MCP 도구 관리를 위한
 * 고수준 API를 제공합니다. GUI와 다른 컴포넌트들이 사용할 주요 진입점입니다.
 *
 * 주요 책임:
 * - Repository와 Registry의 기능을 통합된 API로 노출
 * - 비즈니스 로직 처리 (검증, 트랜잭션 등)
 * - 외부 이벤트 통합 및 전파
 * - 에러 처리 및 로깅
 */
export class McpService {
  private readonly eventEmitter = new SimpleEventEmitter<McpServiceEvents>();
  private initialized = false;

  constructor(
    private readonly repository: McpToolRepository,
    private readonly registry: McpMetadataRegistry,
    private readonly usageService?: import('../usage/service/mcp-usage-service').McpUsageService
  ) {
    // Registry 이벤트를 서비스 이벤트로 전파
    this.setupEventForwarding();
  }

  /**
   * 서비스 초기화
   * Repository와 Registry를 모두 초기화합니다.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.emitOperationEvent('initialize', 'started');

    try {
      await this.registry.initialize();
      this.initialized = true;

      const totalTools = this.registry.totalToolsCount;
      this.eventEmitter.emit('serviceInitialized', { totalTools });
      this.emitOperationEvent('initialize', 'completed', true);
    } catch (error) {
      this.emitOperationEvent('initialize', 'completed', false);
      throw new Error(`Failed to initialize MCP service: ${error}`);
    }
  }

  /**
   * 새로운 MCP 도구 등록
   * @param config MCP 설정
   * @returns 생성된 도구 메타데이터
   */
  async registerTool(config: McpConfig): Promise<McpToolMetadata> {
    this.ensureInitialized();
    this.validateConfig(config);

    this.emitOperationEvent('registerTool', 'started');

    try {
      const tool = await this.registry.registerTool(config);
      this.emitOperationEvent('registerTool', 'completed', true, tool.id);
      return tool;
    } catch (error) {
      this.emitOperationEvent('registerTool', 'completed', false);
      throw new Error(`Failed to register MCP tool: ${error}`);
    }
  }

  /**
   * 도구 제거
   * @param toolId 제거할 도구 ID
   */
  async unregisterTool(toolId: string): Promise<void> {
    this.ensureInitialized();
    this.validateToolExists(toolId);

    this.emitOperationEvent('unregisterTool', 'started', undefined, toolId);

    try {
      await this.registry.unregisterTool(toolId);
      this.emitOperationEvent('unregisterTool', 'completed', true, toolId);
    } catch (error) {
      this.emitOperationEvent('unregisterTool', 'completed', false, toolId);
      throw new Error(`Failed to unregister MCP tool ${toolId}: ${error}`);
    }
  }

  /**
   * 도구 실행 (이 서비스 계층을 통해 호출할 때 Usage 기록 연동)
   * @param toolName 도구 이름
   * @param args 입력 인자
   * @param meta 추가 메타(에이전트/세션)
   */
  async executeTool(
    toolName: string,
    args: unknown,
    meta?: { agentId?: string; sessionId?: string }
  ): Promise<unknown> {
    this.ensureInitialized();

    // find toolId if registered
    const toolMeta = this.registry.getAllTools().items.find((t) => t.name === toolName) || null;
    const toolId = toolMeta?.id;

    this.emitOperationEvent('executeTool', 'started', undefined, toolId ?? undefined);

    const startId = this.usageService
      ? await this.usageService.recordStart({
          toolId,
          toolName,
          agentId: meta?.agentId,
          sessionId: meta?.sessionId,
        })
      : undefined;
    const start = Date.now();
    try {
      const result = await this.registry.executeTool(toolName, args);
      const durationMs = Date.now() - start;
      if (this.usageService && startId) {
        await this.usageService.recordEnd(startId, { status: 'success', durationMs });
      }
      this.emitOperationEvent('executeTool', 'completed', true, toolId ?? undefined);
      return result;
    } catch (e) {
      const durationMs = Date.now() - start;
      if (this.usageService && startId) {
        await this.usageService.recordEnd(startId, {
          status: 'error',
          durationMs,
          errorCode: (e as Error)?.name || 'ERROR',
        });
      }
      this.emitOperationEvent('executeTool', 'completed', false, toolId ?? undefined);
      throw e;
    }
  }

  /**
   * 도구 메타데이터 업데이트
   * @param toolId 도구 ID
   * @param patch 업데이트할 필드들
   * @param options 업데이트 옵션
   * @returns 업데이트된 메타데이터
   */
  async updateTool(
    toolId: string,
    patch: Partial<McpToolMetadata>,
    options?: { expectedVersion?: string }
  ): Promise<McpToolMetadata> {
    this.ensureInitialized();
    this.validateToolExists(toolId);
    this.validateUpdatePatch(patch);

    this.emitOperationEvent('updateTool', 'started', undefined, toolId);

    try {
      const updated = await this.registry.updateTool(toolId, patch, options);
      this.emitOperationEvent('updateTool', 'completed', true, toolId);
      return updated;
    } catch (error) {
      this.emitOperationEvent('updateTool', 'completed', false, toolId);
      throw new Error(`Failed to update MCP tool ${toolId}: ${error}`);
    }
  }

  /**
   * 도구 연결 상태 업데이트
   * @param toolId 도구 ID
   * @param status 새로운 연결 상태
   */
  async updateConnectionStatus(toolId: string, status: McpConnectionStatus): Promise<void> {
    this.ensureInitialized();
    this.validateToolExists(toolId);

    this.emitOperationEvent('updateConnectionStatus', 'started', undefined, toolId);

    try {
      await this.registry.updateConnectionStatus(toolId, status);
      this.emitOperationEvent('updateConnectionStatus', 'completed', true, toolId);
    } catch (error) {
      this.emitOperationEvent('updateConnectionStatus', 'completed', false, toolId);
      throw new Error(`Failed to update connection status for tool ${toolId}: ${error}`);
    }
  }

  /**
   * 도구 사용 횟수 증가
   * @param toolId 도구 ID
   */
  async incrementUsage(toolId: string): Promise<void> {
    this.ensureInitialized();
    this.validateToolExists(toolId);

    try {
      await this.registry.incrementUsage(toolId);
    } catch (error) {
      throw new Error(`Failed to increment usage for tool ${toolId}: ${error}`);
    }
  }

  /**
   * ID로 도구 조회
   * @param toolId 도구 ID
   * @returns 도구 메타데이터 또는 null
   */
  getTool(toolId: string): McpToolMetadata | null {
    this.ensureInitialized();
    return this.registry.getTool(toolId);
  }

  /**
   * 모든 도구 목록 조회
   * @param pagination 페이징 옵션
   * @returns 페이징된 도구 목록
   */
  getAllTools(pagination?: CursorPagination): CursorPaginationResult<McpToolMetadata> {
    this.ensureInitialized();
    return this.registry.getAllTools(pagination);
  }

  /**
   * 조건에 따른 도구 검색 (Repository 기반)
   * @param query 검색 조건
   * @param pagination 페이징 옵션
   * @returns 페이징된 검색 결과
   */
  async searchTools(
    query: McpToolSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<McpToolMetadata>> {
    this.ensureInitialized();

    try {
      return await this.repository.search(query, pagination);
    } catch (error) {
      throw new Error(`Failed to search MCP tools: ${error}`);
    }
  }

  /**
   * 연결 상태별 도구 필터링
   * @param status 연결 상태
   * @returns 해당 상태의 도구들
   */
  getToolsByStatus(status: McpConnectionStatus): McpToolMetadata[] {
    this.ensureInitialized();
    return this.registry.getToolsByStatus(status);
  }

  /**
   * 카테고리별 도구 필터링
   * @param category 카테고리명
   * @returns 해당 카테고리의 도구들
   */
  getToolsByCategory(category: string): McpToolMetadata[] {
    this.ensureInitialized();
    return this.registry.getToolsByCategory(category);
  }

  /**
   * 연결된 도구들의 개수
   */
  get connectedToolsCount(): number {
    this.ensureInitialized();
    return this.registry.connectedToolsCount;
  }

  /**
   * 전체 등록된 도구 개수
   */
  get totalToolsCount(): number {
    this.ensureInitialized();
    return this.registry.totalToolsCount;
  }

  /**
   * 서비스 통계 정보
   */
  getStatistics(): {
    total: number;
    connected: number;
    disconnected: number;
    pending: number;
    error: number;
    byCategory: Record<string, number>;
  } {
    this.ensureInitialized();

    const allTools = this.registry.getAllTools().items;
    const byStatus = {
      connected: 0,
      disconnected: 0,
      pending: 0,
      error: 0,
    };
    const byCategory: Record<string, number> = {};

    for (const tool of allTools) {
      byStatus[tool.status]++;
      const category = tool.category || 'unknown';
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    return {
      total: allTools.length,
      ...byStatus,
      byCategory,
    };
  }

  /**
   * 이벤트 구독
   */
  on<K extends keyof McpServiceEvents>(
    event: K,
    handler: (payload: McpServiceEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * Registry 이벤트를 서비스 이벤트로 전파 설정
   */
  private setupEventForwarding(): void {
    this.registry.on('toolAdded', (payload) => {
      this.eventEmitter.emit('toolAdded', payload);
    });

    this.registry.on('toolRemoved', (payload) => {
      this.eventEmitter.emit('toolRemoved', payload);
    });

    this.registry.on('connectionStatusChanged', (payload) => {
      this.eventEmitter.emit('connectionStatusChanged', payload);
    });

    this.registry.on('toolUpdated', (payload) => {
      this.eventEmitter.emit('toolUpdated', payload);
    });
  }

  /**
   * 작업 이벤트 발행 헬퍼
   */
  private emitOperationEvent(
    operation: string,
    phase: 'started' | 'completed',
    success?: boolean,
    toolId?: string
  ): void {
    if (phase === 'started') {
      this.eventEmitter.emit('operationStarted', { operation, toolId });
    } else {
      this.eventEmitter.emit('operationCompleted', { operation, toolId, success: success! });
    }
  }

  /**
   * 초기화 확인
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('MCP service is not initialized. Call initialize() first.');
    }
  }

  /**
   * 도구 존재 확인
   */
  private validateToolExists(toolId: string): void {
    const tool = this.registry.getTool(toolId);
    if (!tool) {
      throw new Error(`MCP tool not found: ${toolId}`);
    }
  }

  /**
   * MCP 설정 검증
   */
  private validateConfig(config: McpConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Tool name is required');
    }

    if (!config.version || config.version.trim().length === 0) {
      throw new Error('Tool version is required');
    }

    if (config.type === 'stdio') {
      if (!config.command || config.command.trim().length === 0) {
        throw new Error('Command is required for stdio type');
      }
    }

    if (['streamableHttp', 'websocket', 'sse'].includes(config.type)) {
      if (!('url' in config) || !config.url || config.url.trim().length === 0) {
        throw new Error('URL is required for network-based types');
      }

      try {
        new URL(config.url);
      } catch {
        throw new Error('Invalid URL format');
      }
    }
  }

  /**
   * 업데이트 패치 검증
   */
  private validateUpdatePatch(patch: Partial<McpToolMetadata>): void {
    // ID는 변경할 수 없음
    if ('id' in patch) {
      throw new Error('Tool ID cannot be modified');
    }

    // 이름이 빈 문자열이면 안됨
    if ('name' in patch && patch.name !== undefined) {
      if (typeof patch.name !== 'string' || patch.name.trim().length === 0) {
        throw new Error('Tool name must be a non-empty string');
      }
    }

    // 사용 횟수는 음수가 될 수 없음
    if ('usageCount' in patch && patch.usageCount !== undefined) {
      if (typeof patch.usageCount !== 'number' || patch.usageCount < 0) {
        throw new Error('Usage count must be a non-negative number');
      }
    }
  }
}
