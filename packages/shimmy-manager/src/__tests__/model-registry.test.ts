import { describe, expect, it, vi } from 'vitest';

import { ShimmyModelRegistryImpl, parseShimmyModelList } from '../model-registry';
import type { ShimmyModelRegistryOptions, ShimmyModelSummary } from '../types';

const options: ShimmyModelRegistryOptions = {
  shimmyPath: '/tmp/shimmy',
  modelsDir: '/tmp/models',
};

describe('ShimmyModelRegistryImpl', () => {
  it('parses JSON output from shimmy list', () => {
    const output = JSON.stringify([
      { id: 'model-a', is_default: true, path: '/tmp/a.gguf', size_bytes: 1024 },
      { model_id: 'model-b', default: false },
    ]);

    const models = parseShimmyModelList(output);
    expect(models).toEqual<ShimmyModelSummary[]>([
      { id: 'model-a', isDefault: true, path: '/tmp/a.gguf', sizeBytes: 1024 },
      { id: 'model-b', isDefault: false },
    ]);
  });

  it('parses plain text shimmy list output', () => {
    const models = parseShimmyModelList('* llama (default)\n  qwen\n');
    expect(models).toEqual<ShimmyModelSummary[]>([
      { id: 'llama', isDefault: true },
      { id: 'qwen', isDefault: false },
    ]);
  });

  it('ensures default model by invoking download handler when missing', async () => {
    class TestRegistry extends ShimmyModelRegistryImpl {
      private records: ShimmyModelSummary[] = [];

      constructor() {
        super(options);
      }

      setRecords(next: ShimmyModelSummary[]): void {
        this.records = next;
      }

      override async listLocal(): Promise<ShimmyModelSummary[]> {
        return this.records;
      }
    }

    const registry = new TestRegistry();
    registry.setRecords([]);

    const download = vi.fn(async () => {
      registry.setRecords([{ id: 'llama', isDefault: true }]);
    });

    await registry.ensureDefault('llama', download);
    expect(download).toHaveBeenCalledWith('llama', options.modelsDir);
  });
});
