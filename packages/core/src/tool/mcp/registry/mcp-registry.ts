import { SimpleEventEmitter } from '../../../common/event/simple-event-emitter';
import type { McpToolMetadata, McpConnectionStatus } from '../mcp-types';
import type { McpConfig } from '../mcp-config';
import type { McpToolRepository } from '../repository/mcp-tool-repository';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../../common/pagination/cursor-pagination';

/**
 * MCP 도구 레지스트리 이벤트 타입
 */
export type McpRegistryEvents = {
  /** 도구가 추가되었을 때 */
  toolAdded: { tool: McpToolMetadata };
  /** 도구가 제거되었을 때 */
  toolRemoved: { toolId: string };
  /** 도구 연결 상태가 변경되었을 때 */
  connectionStatusChanged: {
    toolId: string;
    status: McpConnectionStatus;
    previousStatus?: McpConnectionStatus;
  };
  /** 도구 메타데이터가 업데이트되었을 때 */
  toolUpdated: { tool: McpToolMetadata; previousVersion?: string };
} & Record<string, unknown>;

/**
 * MCP 도구 레지스트리 - AgentOS SSOT 아키텍처의 핵심 컴포넌트
 *
 * 이 클래스는 MCP 도구들의 단일 정보원(Single Source of Truth)역할을 하며,
 * 런타임 상태 관리와 이벤트 기반 반응성을 제공합니다.
 *
 * 주요 책임:
 * - 도구 메타데이터의 런타임 캐싱 및 관리
 * - 연결 상태 추적 및 관리
 * - 이벤트 기반 변경사항 전파
 * - Repository와의 데이터 동기화
 */
export class McpRegistry {
  private readonly eventEmitter = new SimpleEventEmitter<McpRegistryEvents>();
  private readonly runtimeCache = new Map<string, McpToolMetadata>();
  private readonly connectionStatuses = new Map<string, McpConnectionStatus>();
  private initialized = false;

  constructor(private readonly repository: McpToolRepository) {
    // Repository 이벤트 구독하여 캐시 동기화
    this.repository.on?.('changed', (payload) => {
      if (payload.metadata) {
        this.syncFromRepository(payload.metadata);
      }
    });

    this.repository.on?.('deleted', (payload) => {
      this.removeFromCache(payload.id);
    });

    this.repository.on?.('statusChanged', (payload) => {
      if (payload.metadata) {
        const previousStatus = payload.previousStatus;
        this.updateConnectionStatus(payload.id, payload.metadata.status, previousStatus);
      }
    });
  }

  /**
   * 레지스트리 초기화
   * Repository에서 모든 도구를 로드하여 런타임 캐시를 구성합니다.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const allTools = await this.repository.list();

    // 런타임 캐시 구성
    for (const tool of allTools.items) {
      this.runtimeCache.set(tool.id, tool);
      this.connectionStatuses.set(tool.id, tool.status);
    }

    this.initialized = true;
  }

  /**
   * 새로운 MCP 도구 등록
   * @param config MCP 설정
   * @returns 생성된 도구 메타데이터
   */
  async registerTool(config: McpConfig): Promise<McpToolMetadata> {
    const tool = await this.repository.create(config);

    // Repository 이벤트를 통해 자동으로 캐시에 추가되지만,
    // 즉시 반영을 위해 수동으로도 추가
    this.runtimeCache.set(tool.id, tool);
    this.connectionStatuses.set(tool.id, tool.status);

    this.eventEmitter.emit('toolAdded', { tool });

    return tool;
  }

  /**
   * 도구 제거
   * @param toolId 제거할 도구 ID
   */
  async unregisterTool(toolId: string): Promise<void> {
    await this.repository.delete(toolId);

    // Repository 이벤트를 통해 자동으로 캐시에서 제거되지만,
    // 즉시 반영을 위해 수동으로도 제거
    this.removeFromCache(toolId);
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
    const previousVersion = this.runtimeCache.get(toolId)?.version;
    const updated = await this.repository.update(toolId, patch, options);

    // Repository 이벤트를 통해 자동으로 캐시가 업데이트되지만,
    // 즉시 반영을 위해 수동으로도 업데이트
    this.syncFromRepository(updated);

    this.eventEmitter.emit('toolUpdated', { tool: updated, previousVersion });

    return updated;
  }

  /**
   * 도구 연결 상태 업데이트
   * @param toolId 도구 ID
   * @param status 새로운 연결 상태
   */
  async updateConnectionStatus(
    toolId: string,
    status: McpConnectionStatus,
    previousStatus?: McpConnectionStatus
  ): Promise<void> {
    const currentStatus = this.connectionStatuses.get(toolId);

    if (currentStatus === status) return; // 변경사항 없음

    // 런타임 상태 즉시 업데이트
    this.connectionStatuses.set(toolId, status);

    // Repository에도 반영
    try {
      await this.repository.update(toolId, { status });
    } catch (error) {
      // Repository 업데이트 실패 시 런타임 상태 롤백
      if (currentStatus) {
        this.connectionStatuses.set(toolId, currentStatus);
      }
      throw error;
    }

    this.eventEmitter.emit('connectionStatusChanged', {
      toolId,
      status,
      previousStatus: previousStatus || currentStatus,
    });
  }

  /**
   * 도구 사용 횟수 증가
   * @param toolId 도구 ID
   */
  async incrementUsage(toolId: string): Promise<void> {
    const tool = this.runtimeCache.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found in registry: ${toolId}`);
    }

    const newUsageCount = tool.usageCount + 1;
    await this.updateTool(toolId, {
      usageCount: newUsageCount,
      lastUsedAt: new Date(),
    });
  }

  /**
   * ID로 도구 조회 (런타임 캐시 우선)
   * @param toolId 도구 ID
   * @returns 도구 메타데이터 또는 null
   */
  getTool(toolId: string): McpToolMetadata | null {
    return this.runtimeCache.get(toolId) || null;
  }

  /**
   * 모든 도구 목록 조회 (런타임 캐시 기반)
   * @param pagination 페이징 옵션
   * @returns 페이징된 도구 목록
   */
  getAllTools(pagination?: CursorPagination): CursorPaginationResult<McpToolMetadata> {
    const tools = Array.from(this.runtimeCache.values());

    // 기본 정렬: 최근 사용순
    tools.sort((a, b) => {
      const aLastUsed = a.lastUsedAt?.getTime() || 0;
      const bLastUsed = b.lastUsedAt?.getTime() || 0;
      return bLastUsed - aLastUsed;
    });

    // 간단한 인메모리 페이징
    if (!pagination) {
      return {
        items: tools,
        nextCursor: '',
        hasMore: false,
      };
    }

    const { cursor, limit = 20, direction = 'forward' } = pagination;
    let startIndex = 0;

    if (cursor) {
      const cursorIndex = tools.findIndex((tool) => tool.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = direction === 'forward' ? cursorIndex + 1 : Math.max(0, cursorIndex - limit);
      }
    }

    const endIndex = startIndex + limit;
    const page = tools.slice(startIndex, endIndex);
    const hasMore = endIndex < tools.length;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : '';

    return {
      items: page,
      nextCursor,
      hasMore,
    };
  }

  /**
   * 연결 상태별 도구 필터링
   * @param status 연결 상태
   * @returns 해당 상태의 도구들
   */
  getToolsByStatus(status: McpConnectionStatus): McpToolMetadata[] {
    return Array.from(this.runtimeCache.values()).filter((tool) => tool.status === status);
  }

  /**
   * 카테고리별 도구 필터링
   * @param category 카테고리명
   * @returns 해당 카테고리의 도구들
   */
  getToolsByCategory(category: string): McpToolMetadata[] {
    return Array.from(this.runtimeCache.values()).filter((tool) => tool.category === category);
  }

  /**
   * 현재 연결된 도구들의 개수
   */
  get connectedToolsCount(): number {
    return Array.from(this.connectionStatuses.values()).filter((status) => status === 'connected')
      .length;
  }

  /**
   * 전체 등록된 도구 개수
   */
  get totalToolsCount(): number {
    return this.runtimeCache.size;
  }

  /**
   * 이벤트 구독
   */
  on<K extends keyof McpRegistryEvents>(
    event: K,
    handler: (payload: McpRegistryEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * Repository에서 변경된 데이터를 런타임 캐시에 동기화
   */
  private syncFromRepository(tool: McpToolMetadata): void {
    this.runtimeCache.set(tool.id, tool);
    this.connectionStatuses.set(tool.id, tool.status);
  }

  /**
   * 런타임 캐시에서 도구 제거
   */
  private removeFromCache(toolId: string): void {
    this.runtimeCache.delete(toolId);
    this.connectionStatuses.delete(toolId);

    this.eventEmitter.emit('toolRemoved', { toolId });
  }
}
