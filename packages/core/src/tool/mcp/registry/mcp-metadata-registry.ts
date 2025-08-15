import { SimpleEventEmitter } from '../../../common/event/simple-event-emitter';
import type { McpToolMetadata, McpConnectionStatus } from '../mcp-types';
import type { McpConfig } from '../mcp-config';
import type { McpToolRepository } from '../repository/mcp-tool-repository';
import { Mcp } from '../mcp';
import { McpRegistry } from '../mcp.registery';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../../common/pagination/cursor-pagination';

/**
 * MCP 메타데이터 레지스트리 이벤트 타입
 */
export type McpMetadataRegistryEvents = {
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
 * MCP 메타데이터 레지스트리 - 실제 MCP 구현과 메타데이터를 통합 관리
 *
 * 이 클래스는 기존 MCP 구현(mcp.ts, mcp.registery.ts)을 래핑하여
 * 메타데이터 영속화와 AgentOS SSOT 아키텍처를 지원합니다.
 *
 * 주요 책임:
 * - 실제 MCP 연결과 메타데이터 동기화
 * - Repository와의 데이터 동기화
 * - 이벤트 기반 변경사항 전파
 * - 실제 MCP 프로토콜 준수
 */
export class McpMetadataRegistry {
  private readonly eventEmitter = new SimpleEventEmitter<McpMetadataRegistryEvents>();
  private readonly mcpRegistry: McpRegistry;
  private readonly metadataCache = new Map<string, McpToolMetadata>();
  private initialized = false;

  constructor(private readonly repository: McpToolRepository) {
    this.mcpRegistry = new McpRegistry();

    // 기존 MCP Registry 이벤트 구독
    this.mcpRegistry.onRegister((mcp) => {
      this.syncMcpToMetadata(mcp);
    });

    this.mcpRegistry.onUnregister((mcp) => {
      this.handleMcpUnregister(mcp);
    });

    // Repository 이벤트 구독하여 캐시 동기화
    this.repository.on?.('changed', (payload) => {
      if (payload.metadata) {
        this.metadataCache.set(payload.metadata.id, payload.metadata);
      }
    });

    this.repository.on?.('deleted', (payload) => {
      this.metadataCache.delete(payload.id);
    });
  }

  /**
   * 레지스트리 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Repository에서 기존 메타데이터 로드
    const allTools = await this.repository.list();
    for (const tool of allTools.items) {
      this.metadataCache.set(tool.id, tool);

      // 메타데이터에 연결 정보가 있으면 MCP 재연결 시도
      if (tool.config && tool.status !== 'error') {
        try {
          await this.reconnectMcp(tool);
        } catch (error) {
          // 재연결 실패는 로그만 남기고 계속 진행
          console.warn(`Failed to reconnect MCP ${tool.name}:`, error);
        }
      }
    }

    this.initialized = true;
  }

  /**
   * 새로운 MCP 도구 등록
   */
  async registerTool(config: McpConfig): Promise<McpToolMetadata> {
    // 1. Repository에 메타데이터 저장
    const metadata = await this.repository.create(config);
    this.metadataCache.set(metadata.id, metadata);

    try {
      // 2. 실제 MCP 연결 (모든 타입 지원)
      await this.mcpRegistry.register(config);

      // 3. 연결 성공 시 상태 업데이트
      const updatedMetadata = await this.updateConnectionStatus(metadata.id, 'connected');

      this.eventEmitter.emit('toolAdded', { tool: updatedMetadata });
      return updatedMetadata;
    } catch (error) {
      // 4. 연결 실패 시 에러 상태로 업데이트
      const errorMetadata = await this.updateConnectionStatus(metadata.id, 'error');

      this.eventEmitter.emit('toolAdded', { tool: errorMetadata });
      throw new Error(`Failed to register MCP tool: ${error}`);
    }
  }

  /**
   * 도구 제거
   */
  async unregisterTool(toolId: string): Promise<void> {
    const metadata = this.metadataCache.get(toolId);
    if (!metadata) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // 1. MCP 연결 해제
    if (this.mcpRegistry.isRegistered(metadata.name)) {
      await this.mcpRegistry.unregister(metadata.name);
    }

    // 2. Repository에서 제거
    await this.repository.delete(toolId);
    this.metadataCache.delete(toolId);

    this.eventEmitter.emit('toolRemoved', { toolId });
  }

  /**
   * 도구 메타데이터 업데이트
   */
  async updateTool(
    toolId: string,
    patch: Partial<McpToolMetadata>,
    options?: { expectedVersion?: string }
  ): Promise<McpToolMetadata> {
    const updated = await this.repository.update(toolId, patch, options);
    this.metadataCache.set(toolId, updated);

    this.eventEmitter.emit('toolUpdated', { tool: updated });
    return updated;
  }

  /**
   * 연결 상태 업데이트
   */
  async updateConnectionStatus(
    toolId: string,
    status: McpConnectionStatus,
    previousStatus?: McpConnectionStatus
  ): Promise<McpToolMetadata> {
    const currentMetadata = this.metadataCache.get(toolId);
    const prevStatus = previousStatus || currentMetadata?.status;

    const updated = await this.repository.update(toolId, { status });
    this.metadataCache.set(toolId, updated);

    this.eventEmitter.emit('connectionStatusChanged', {
      toolId,
      status,
      previousStatus: prevStatus,
    });

    return updated;
  }

  /**
   * 도구 사용 횟수 증가
   */
  async incrementUsage(toolId: string): Promise<void> {
    const metadata = this.metadataCache.get(toolId);
    if (!metadata) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    await this.updateTool(toolId, {
      usageCount: metadata.usageCount + 1,
      lastUsedAt: new Date(),
    });

    // MCP 실제 사용량도 추적
    const mcp = await this.mcpRegistry.get(metadata.name);
    if (mcp) {
      // MCP 클래스에 사용량 추적 기능이 있다면 호출
      // mcp.trackUsage() 등
    }
  }

  /**
   * ID로 도구 조회
   */
  getTool(toolId: string): McpToolMetadata | null {
    return this.metadataCache.get(toolId) || null;
  }

  /**
   * 이름으로 실제 MCP 인스턴스 조회
   */
  async getMcp(toolName: string): Promise<Mcp | null> {
    return this.mcpRegistry.get(toolName);
  }

  /**
   * 도구명으로 도구 실행
   */
  async executeTool(toolName: string, args: unknown): Promise<unknown> {
    const mcpTool = await this.mcpRegistry.getTool(toolName);
    if (!mcpTool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // 사용량 증가
    const metadata = Array.from(this.metadataCache.values()).find(
      (m) => m.name === mcpTool.mcp.name
    );

    if (metadata) {
      await this.incrementUsage(metadata.id);
    }

    // 실제 도구 실행
    const result = await mcpTool.mcp.invokeTool(mcpTool.tool, {
      input: args as Record<string, unknown>,
    });
    return result;
  }

  /**
   * 모든 도구 목록 조회
   */
  getAllTools(pagination?: CursorPagination): CursorPaginationResult<McpToolMetadata> {
    const tools = Array.from(this.metadataCache.values());

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
   */
  getToolsByStatus(status: McpConnectionStatus): McpToolMetadata[] {
    return Array.from(this.metadataCache.values()).filter((tool) => tool.status === status);
  }

  /**
   * 카테고리별 도구 필터링
   */
  getToolsByCategory(category: string): McpToolMetadata[] {
    return Array.from(this.metadataCache.values()).filter((tool) => tool.category === category);
  }

  /**
   * 연결된 도구들의 개수
   */
  get connectedToolsCount(): number {
    return this.getToolsByStatus('connected').length;
  }

  /**
   * 전체 등록된 도구 개수
   */
  get totalToolsCount(): number {
    return this.metadataCache.size;
  }

  /**
   * 이벤트 구독
   */
  on<K extends keyof McpMetadataRegistryEvents>(
    event: K,
    handler: (payload: McpMetadataRegistryEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * MCP에서 메타데이터로 동기화
   */
  private async syncMcpToMetadata(mcp: Mcp): Promise<void> {
    const metadata = Array.from(this.metadataCache.values()).find((m) => m.name === mcp.name);

    if (metadata) {
      await this.updateConnectionStatus(metadata.id, 'connected');
    }
  }

  /**
   * MCP 등록 해제 처리
   */
  private async handleMcpUnregister(mcp: Mcp): Promise<void> {
    const metadata = Array.from(this.metadataCache.values()).find((m) => m.name === mcp.name);

    if (metadata) {
      await this.updateConnectionStatus(metadata.id, 'disconnected');
    }
  }

  /**
   * 메타데이터로부터 MCP 재연결
   */
  private async reconnectMcp(metadata: McpToolMetadata): Promise<void> {
    if (!metadata.config) return;

    const config = metadata.config as McpConfig;

    // 모든 MCP 타입 지원
    await this.mcpRegistry.register(config);
  }
}
