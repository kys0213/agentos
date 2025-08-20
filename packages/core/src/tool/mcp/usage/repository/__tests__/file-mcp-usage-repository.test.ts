import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileMcpUsageRepository } from '../file-mcp-usage-repository';
import type { McpUsageLog } from '../../types';

describe('FileMcpUsageRepository', () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const filePath = path.join(tmpDir, 'usage.json');

  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  it('appends and lists logs', async () => {
    const repo = new FileMcpUsageRepository(filePath);
    const t0 = new Date('2025-01-01T00:00:00Z');
    const logs: McpUsageLog[] = [
      {
        id: '1',
        toolName: 'a',
        timestamp: t0,
        operation: 'tool.call',
        status: 'success',
        durationMs: 10,
      },
      {
        id: '2',
        toolName: 'b',
        timestamp: new Date(t0.getTime() + 1000),
        operation: 'tool.call',
        status: 'error',
        durationMs: 20,
      },
    ];
    await repo.append(logs);
    const all = await repo.list();
    expect(all.items.map((l) => l.id)).toEqual(['1', '2']);
    const errors = await repo.list({ status: 'error' });
    expect(errors.items.map((l) => l.id)).toEqual(['2']);
  });

  it('supports time range filter and pagination', async () => {
    const repo = new FileMcpUsageRepository(filePath);
    const base = new Date('2025-01-01T00:00:00Z');
    for (let i = 0; i < 5; i++) {
      await repo.append({
        id: String(i + 1),
        toolId: 't',
        timestamp: new Date(base.getTime() + i * 1000),
        operation: 'tool.call',
        status: i % 2 === 0 ? 'success' : 'error',
        durationMs: 5 + i,
      });
    }
    const page1 = await repo.list(
      { toolId: 't', from: new Date(base.getTime() + 1000) },
      { limit: 2, cursor: '', direction: 'forward' }
    );
    expect(page1.items.map((l) => l.id)).toEqual(['2', '3']);
    const page2 = await repo.list(
      { toolId: 't' },
      { cursor: page1.items[1].id, limit: 2, direction: 'forward' }
    );
    expect(page2.items.map((l) => l.id)).toEqual(['4', '5']);
  });

  it('computes stats', async () => {
    const repo = new FileMcpUsageRepository(filePath);
    const t0 = new Date('2025-01-01T00:00:00Z');
    await repo.append({
      id: '1',
      toolName: 'a',
      timestamp: t0,
      operation: 'tool.call',
      status: 'success',
      durationMs: 10,
    });
    await repo.append({
      id: '2',
      toolName: 'a',
      timestamp: new Date(t0.getTime() + 2000),
      operation: 'tool.call',
      status: 'error',
      durationMs: 30,
    });
    const stats = await repo.getStats({ toolName: 'a' });
    expect(stats.totalUsage).toBe(2);
    expect(stats.errorCount).toBe(1);
    expect(stats.successRate).toBeCloseTo(0.5);
    expect(stats.averageDuration).toBeGreaterThan(0);
    expect(stats.lastUsedAt?.getTime()).toBe(new Date(t0.getTime() + 2000).getTime());
  });
});
