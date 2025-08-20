import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { McpService } from '../mcp-service';
import { FileMcpUsageRepository } from '../../usage/repository/file-mcp-usage-repository';
import { McpUsageService } from '../../usage/service/mcp-usage-service';
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
    // Minimal stubs for dependencies
    const fakeRepo: any = {};
    const fakeRegistry: any = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getAllTools: jest.fn().mockReturnValue({
        items: [
          {
            id: 'tool-1',
            name: 'echo-tool',
            description: 'Echo tool',
            version: '1.0.0',
            permissions: [],
            status: 'connected',
            usageCount: 0,
          },
        ],
      }),
      executeTool: jest.fn().mockResolvedValue({ ok: true }),
      on: jest.fn().mockReturnValue(() => {}),
    };
    const service = new McpService(fakeRepo, fakeRegistry, usageService);

    await service.initialize();
    await service.executeTool('echo-tool', { text: 'hi' }, { agentId: 'agent-1', sessionId: 's1' });

    const logs = await usageRepo.list({ toolId: 'tool-1' });
    expect(logs.items.length).toBe(1);
    expect(logs.items[0].status).toBe('success');
    expect(logs.items[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
