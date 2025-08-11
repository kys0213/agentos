import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { JsonFileHandler } from '../JsonFileHandler';

describe('JsonFileHandler revivers', () => {
  it('revives ISO date strings to Date objects', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'json-handler-'));
    const file = path.join(tmpDir, 'data.json');
    const handler = new JsonFileHandler<{ createdAt: Date }>(file);
    const date = new Date('2024-01-01T00:00:00.000Z');
    await handler.write({ createdAt: date });
    const read = await handler.read({ reviveDates: true });
    expect(read.success).toBe(true);
    if (read.success) {
      expect(read.result.createdAt).toBeInstanceOf(Date);
      expect(read.result.createdAt.toISOString()).toBe(date.toISOString());
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
