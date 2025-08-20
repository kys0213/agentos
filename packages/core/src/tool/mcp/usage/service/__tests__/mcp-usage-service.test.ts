import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileMcpUsageRepository } from '../../repository/file-mcp-usage-repository';
import { McpUsageService } from '../mcp-usage-service';

describe('McpUsageService', () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const filePath = path.join(tmpDir, 'usage.json');

  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('records start/end and persists a usage log', async () => {
    const repo = new FileMcpUsageRepository(filePath);
    const service = new McpUsageService(repo);

    const id = await service.recordStart({ toolId: 't1', toolName: 'translate', agentId: 'a1' });
    await service.recordEnd(id, { status: 'success', durationMs: 42 });

    const { items } = await service.list({ toolId: 't1' });
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(id);
    expect(items[0].status).toBe('success');
    expect(items[0].durationMs).toBe(42);
  });

  it('computes stats via repository', async () => {
    const repo = new FileMcpUsageRepository(filePath);
    const service = new McpUsageService(repo);

    const id1 = await service.recordStart({ toolName: 'sum' });
    await service.recordEnd(id1, { status: 'success', durationMs: 10 });
    const id2 = await service.recordStart({ toolName: 'sum' });
    await service.recordEnd(id2, { status: 'error', durationMs: 30, errorCode: 'EFAIL' });

    const stats = await service.getStats({ toolName: 'sum' });
    expect(stats.totalUsage).toBe(2);
    expect(stats.errorCount).toBe(1);
    expect(stats.successRate).toBeCloseTo(0.5);
    expect(stats.averageDuration).toBeGreaterThan(0);
  });
});
