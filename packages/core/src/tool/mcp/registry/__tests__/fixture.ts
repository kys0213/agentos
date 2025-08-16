import {
  CursorPagination,
  CursorPaginationResult,
} from '../../../../common/pagination/cursor-pagination';
import { McpConfig } from '../../mcp-config';
import { McpToolMetadata } from '../../mcp-types';
import {
  McpToolRepository,
  McpToolRepositoryEventPayload,
} from '../../repository/mcp-tool-repository';

// Mock Repository 구현
export class MockMcpToolRepository implements McpToolRepository {
  private tools = new Map<string, McpToolMetadata>();
  private eventHandlers = new Map<string, ((payload: McpToolRepositoryEventPayload) => void)[]>();

  async get(id: string): Promise<McpToolMetadata | null> {
    return this.tools.get(id) || null;
  }

  async list(pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>> {
    const items = Array.from(this.tools.values());
    return {
      items,
      nextCursor: '',
      hasMore: false,
    };
  }

  async search(): Promise<CursorPaginationResult<McpToolMetadata>> {
    return this.list();
  }

  async create(config: McpConfig): Promise<McpToolMetadata> {
    const tool: McpToolMetadata = {
      id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: `MCP Tool: ${config.name}`,
      version: config.version,
      category: 'general',
      provider: 'Test Provider',
      status: 'disconnected',
      usageCount: 0,
      permissions: [],
      config: {},
    };

    this.tools.set(tool.id, tool);
    this.emit('changed', { id: tool.id, metadata: tool });

    return tool;
  }

  async update(
    id: string,
    patch: Partial<McpToolMetadata>,
    options?: { expectedVersion?: string }
  ): Promise<McpToolMetadata> {
    const existing = this.tools.get(id);
    if (!existing) {
      throw new Error(`Tool not found: ${id}`);
    }

    if (options?.expectedVersion && existing.version !== options.expectedVersion) {
      throw new Error(`Version conflict for tool ${id}`);
    }

    const previousStatus = existing.status;
    const updated: McpToolMetadata = {
      ...existing,
      ...patch,
      id, // ID는 변경 불가
      version: `v${Date.now()}`, // 새 버전 할당
    };

    this.tools.set(id, updated);
    this.emit('changed', { id, metadata: updated });

    if (previousStatus !== updated.status) {
      this.emit('statusChanged', { id, metadata: updated, previousStatus });
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.tools.has(id)) {
      throw new Error(`Tool not found: ${id}`);
    }

    this.tools.delete(id);
    this.emit('deleted', { id });
  }

  on(
    event: 'changed' | 'deleted' | 'statusChanged',
    handler: (payload: McpToolRepositoryEventPayload) => void
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    this.eventHandlers.get(event)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    };
  }

  private emit(event: string, payload: McpToolRepositoryEventPayload): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(payload));
  }
}
