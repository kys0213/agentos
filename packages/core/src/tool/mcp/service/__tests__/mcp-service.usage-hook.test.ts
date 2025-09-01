import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { McpService } from '../mcp-service';
import { FileMcpUsageRepository } from '../../usage/repository/file-mcp-usage-repository';
import { McpUsageService } from '../../usage/service/mcp-usage-service';
import { McpMetadataRegistry } from '../../registry/mcp-metadata-registry';
import { McpRegistry } from '../../mcp.registery';
import type { McpToolRepository } from '../../repository/mcp-tool-repository';
import type { McpToolMetadata } from '../../mcp-types';
import type { CursorPaginationResult } from '../../../../common/pagination/cursor-pagination';
describe('McpService usage hook integration', () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const usageFile = path.join(tmpDir, 'usage.json');

  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('records usage when executing tool via service', async () => {
    const usageRepo = new FileMcpUsageRepository(usageFile);
    const usageService = new McpUsageService(usageRepo);

    // Minimal in-memory repo stub to satisfy constructor side-effects
    const repoStub: McpToolRepository = {
      async get() {
        return null;
      },
      async list() {
        return { items: [], nextCursor: '', hasMore: false };
      },
      async search() {
        return { items: [], nextCursor: '', hasMore: false };
      },
      async create(config) {
        return {
          id: 'tool-1',
          name: config.name,
          description: '',
          version: config.version,
          permissions: [],
          status: 'connected',
          usageCount: 0,
        } as McpToolMetadata;
      },
      async update(id, patch) {
        return {
          id,
          name: patch.name ?? 'echo-tool',
          description: patch.description ?? '',
          version: patch.version ?? '1.0.0',
          permissions: [],
          status: patch.status ?? 'connected',
          usageCount: typeof patch.usageCount === 'number' ? patch.usageCount : 0,
        } as McpToolMetadata;
      },
      async delete() {
        return;
      },
      on: () => () => {},
    };

    // Test registry that extends the concrete class to avoid unsafe casts
    class TestRegistry extends McpMetadataRegistry {
      private tools: McpToolMetadata[] = [
        {
          id: 'tool-1',
          name: 'echo-tool',
          description: 'Echo tool',
          version: '1.0.0',
          permissions: [],
          status: 'connected',
          usageCount: 0,
        },
      ];

      constructor() {
        super(repoStub, new McpRegistry());
      }

      // Override to avoid heavy initialization
      async initialize(): Promise<void> {
        return;
      }

      getAllTools(): CursorPaginationResult<McpToolMetadata> {
        return { items: this.tools, nextCursor: '', hasMore: false };
      }

      async executeTool(): Promise<unknown> {
        return { ok: true };
      }

      on(): () => void {
        return () => {};
      }

      get totalToolsCount(): number {
        return this.tools.length;
      }
    }

    const service = new McpService(repoStub, new TestRegistry(), usageService);

    await service.initialize();
    await service.executeTool('echo-tool', { text: 'hi' }, { agentId: 'agent-1', sessionId: 's1' });

    const logs = await usageRepo.list({ toolId: 'tool-1' });
    expect(logs.items.length).toBe(1);
    expect(logs.items[0].status).toBe('success');
    expect(logs.items[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
