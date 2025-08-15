import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CursorPagination, CursorPaginationResult } from '../../../common/pagination/cursor-pagination';
import { paginateByCursor } from '../../../common/pagination/paginate';
import { SimpleEventEmitter } from '../../../common/event/simple-event-emitter';
import { McpToolMetadata, McpConnectionStatus } from '../mcp-types';
import { McpConfig } from '../mcp-config';
import {
  McpToolRepository,
  McpToolSearchQuery,
  McpToolRepositoryEvent,
  McpToolRepositoryEventHandler,
  McpToolRepositoryEventPayload,
  Unsubscribe
} from './mcp-tool-repository';

/**
 * 파일 기반 MCP 도구 Repository 구현
 * 
 * JSON 파일을 사용하여 도구 메타데이터를 영속화합니다.
 * 이벤트 기반 반응성을 위해 SimpleEventEmitter를 사용합니다.
 */
export class FileMcpToolRepository implements McpToolRepository {
  private readonly eventEmitter = new SimpleEventEmitter<{
    changed: McpToolRepositoryEventPayload;
    deleted: McpToolRepositoryEventPayload;
    statusChanged: McpToolRepositoryEventPayload;
  }>();

  private cache: Map<string, McpToolMetadata> = new Map();
  private initialized = false;

  constructor(
    private readonly storagePath: string,
    private readonly options: {
      /** 파일 변경 감지 활성화 여부 */
      enableWatching?: boolean;
      /** 캐시 사용 여부 */
      enableCaching?: boolean;
    } = {}
  ) {
    this.options = {
      enableWatching: true,
      enableCaching: true,
      ...options
    };
  }

  async get(id: string): Promise<McpToolMetadata | null> {
    await this.ensureInitialized();

    if (this.options.enableCaching && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const tools = await this.loadAll();
    const tool = tools.find(t => t.id === id);

    if (tool && this.options.enableCaching) {
      this.cache.set(id, tool);
    }

    return tool || null;
  }

  async list(pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>> {
    await this.ensureInitialized();
    const tools = await this.loadAll();

    return paginateByCursor(tools, pagination);
  }

  async search(
    query: McpToolSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<McpToolMetadata>> {
    await this.ensureInitialized();
    const tools = await this.loadAll();

    const filtered = tools.filter(tool => {
      // 카테고리 필터
      if (query.category && tool.category !== query.category) {
        return false;
      }

      // 상태 필터
      if (query.status && tool.status !== query.status) {
        return false;
      }

      // 제공자 필터
      if (query.provider && tool.provider !== query.provider) {
        return false;
      }

      // 키워드 검색
      if (query.keywords && query.keywords.length > 0) {
        const searchText = `${tool.name} ${tool.description}`.toLowerCase();
        const hasMatchingKeyword = query.keywords.some(keyword =>
          searchText.includes(keyword.toLowerCase())
        );
        if (!hasMatchingKeyword) {
          return false;
        }
      }

      return true;
    });

    return paginateByCursor(filtered, pagination);
  }

  async create(config: McpConfig): Promise<McpToolMetadata> {
    await this.ensureInitialized();

    const metadata: McpToolMetadata = {
      id: this.generateToolId(config),
      name: config.name,
      description: `MCP Tool: ${config.name}`,
      version: config.version,
      category: this.inferCategory(config),
      provider: this.inferProvider(config),
      endpoint: this.extractEndpoint(config),
      permissions: [],
      status: 'disconnected',
      usageCount: 0,
      config: this.sanitizeConfig(config),
    };

    const tools = await this.loadAll();
    tools.push(metadata);
    await this.saveAll(tools);

    if (this.options.enableCaching) {
      this.cache.set(metadata.id, metadata);
    }

    this.eventEmitter.emit('changed', { id: metadata.id, metadata });

    return metadata;
  }

  async update(
    id: string,
    patch: Partial<McpToolMetadata>,
    options?: { expectedVersion?: string }
  ): Promise<McpToolMetadata> {
    await this.ensureInitialized();

    const tools = await this.loadAll();
    const index = tools.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error(`MCP tool not found: ${id}`);
    }

    const existing = tools[index];

    // 낙관적 동시성 제어
    if (options?.expectedVersion && existing.version !== options.expectedVersion) {
      throw new Error(
        `Version conflict for tool ${id}. Expected: ${options.expectedVersion}, Current: ${existing.version}`
      );
    }

    const previousStatus = existing.status;
    const updated: McpToolMetadata = {
      ...existing,
      ...patch,
      id, // ID는 변경 불가
      version: this.generateVersion(), // 새 버전 할당
      lastUsedAt: patch.usageCount !== existing.usageCount ? new Date() : existing.lastUsedAt,
    };

    tools[index] = updated;
    await this.saveAll(tools);

    if (this.options.enableCaching) {
      this.cache.set(id, updated);
    }

    // 이벤트 발행
    this.eventEmitter.emit('changed', { id, metadata: updated });
    
    if (previousStatus !== updated.status) {
      this.eventEmitter.emit('statusChanged', {
        id,
        metadata: updated,
        previousStatus
      });
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.ensureInitialized();

    const tools = await this.loadAll();
    const index = tools.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error(`MCP tool not found: ${id}`);
    }

    tools.splice(index, 1);
    await this.saveAll(tools);

    if (this.options.enableCaching) {
      this.cache.delete(id);
    }

    this.eventEmitter.emit('deleted', { id });
  }

  on(
    event: McpToolRepositoryEvent,
    handler: McpToolRepositoryEventHandler
  ): Unsubscribe {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * Repository 초기화 (저장소 디렉토리 생성 등)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(path.dirname(this.storagePath), { recursive: true });

      // 파일이 존재하지 않으면 빈 배열로 초기화
      try {
        await fs.access(this.storagePath);
      } catch {
        await this.saveAll([]);
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize MCP tool repository: ${error}`);
    }
  }

  /**
   * 모든 도구 메타데이터 로드
   */
  private async loadAll(): Promise<McpToolMetadata[]> {
    try {
      const content = await fs.readFile(this.storagePath, 'utf-8');
      return JSON.parse(content) as McpToolMetadata[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load MCP tools: ${error}`);
    }
  }

  /**
   * 모든 도구 메타데이터 저장
   */
  private async saveAll(tools: McpToolMetadata[]): Promise<void> {
    try {
      const content = JSON.stringify(tools, null, 2);
      await fs.writeFile(this.storagePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save MCP tools: ${error}`);
    }
  }

  /**
   * 도구 ID 생성
   */
  private generateToolId(config: McpConfig): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `mcp_${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${random}`;
  }

  /**
   * 버전 문자열 생성 (ETag 스타일)
   */
  private generateVersion(): string {
    return `v${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 설정으로부터 카테고리 추론
   */
  private inferCategory(config: McpConfig): string {
    const name = config.name.toLowerCase();

    if (name.includes('search') || name.includes('web')) return 'search';
    if (name.includes('code') || name.includes('dev')) return 'development';
    if (name.includes('data') || name.includes('db')) return 'data';
    if (name.includes('file') || name.includes('doc')) return 'productivity';
    if (name.includes('api') || name.includes('service')) return 'api';

    return 'general';
  }

  /**
   * 설정으로부터 제공자 추론
   */
  private inferProvider(config: McpConfig): string {
    if (config.type === 'stdio') {
      return 'Local Process';
    }

    if ('url' in config && config.url) {
      try {
        const url = new URL(config.url);
        return url.hostname;
      } catch {
        return 'External Service';
      }
    }

    return 'Unknown';
  }

  /**
   * 설정으로부터 엔드포인트 추출
   */
  private extractEndpoint(config: McpConfig): string | undefined {
    if (config.type === 'stdio') {
      return `${config.command} ${(config.args || []).join(' ')}`.trim();
    }

    if ('url' in config) {
      return config.url;
    }

    return undefined;
  }

  /**
   * 민감한 정보 제거한 설정 저장
   */
  private sanitizeConfig(config: McpConfig): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { env, headers, ...sanitized } = config as any;
    
    return {
      ...sanitized,
      // 환경변수나 헤더에서 민감한 정보 제거
      ...(env && { env: this.sanitizeEnv(env) }),
      ...(headers && { headers: this.sanitizeHeaders(headers) }),
    };
  }

  /**
   * 환경변수에서 민감한 값 마스킹
   */
  private sanitizeEnv(env: Record<string, string>): Record<string, string> {
    const sensitiveKeys = ['api_key', 'secret', 'token', 'password', 'key'];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      const isSensitive = sensitiveKeys.some(sensitive =>
        key.toLowerCase().includes(sensitive)
      );

      sanitized[key] = isSensitive ? '***masked***' : value;
    }

    return sanitized;
  }

  /**
   * 헤더에서 민감한 값 마스킹
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'x-api-key', 'authentication'];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      const isSensitive = sensitiveHeaders.some(sensitive =>
        key.toLowerCase().includes(sensitive)
      );

      sanitized[key] = isSensitive ? '***masked***' : value;
    }

    return sanitized;
  }
}