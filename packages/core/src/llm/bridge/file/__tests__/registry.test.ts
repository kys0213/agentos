import type { LlmManifest } from 'llm-bridge-spec';
import { LlmBridgeLoader } from 'llm-bridge-loader';
import { FileBasedLlmBridgeRegistry } from '../file-based-llm-bridge-registry';
import path from 'node:path';

// In-memory file store to mock @agentos/lang fs layer deterministically
const store = new Map<string, string>();

// Helper to extract filename from path
const filenameOf = (p: string) => path.basename(p);

jest.mock('@agentos/lang', () => {
  const ok = <T>(result: T) => ({ success: true, result });
  const fail = (reason: unknown) => ({ success: false, reason });

  class MockJsonFileHandler<T> {
    constructor(private filePath: string) {}
    static create<T>(filePath: string) {
      return new MockJsonFileHandler<T>(filePath);
    }
    async read(options: any = {}) {
      const content = store.get(this.filePath);
      if (!content) {
        if (options.useDefaultOnError && options.defaultValue !== undefined) {
          return ok(options.defaultValue);
        }
        return fail(new Error('Empty JSON file'));
      }
      try {
        const data = JSON.parse(content);
        return ok(data);
      } catch (e) {
        return fail(e);
      }
    }
    async write(data: any) {
      try {
        store.set(this.filePath, JSON.stringify(data));
        return ok(undefined);
      } catch (e) {
        return fail(e);
      }
    }
  }

  const FileUtils = {
    async ensureDir(_dirPath: string) {
      return ok(undefined);
    },
    async readDir(dirPath: string) {
      const files: string[] = [];
      for (const key of store.keys()) {
        if (key.startsWith(dirPath)) {
          files.push(filenameOf(key));
        }
      }
      return ok(files);
    },
    async remove(filePath: string) {
      store.delete(filePath);
      return ok(undefined);
    },
    async writeSafe(filePath: string, content: string) {
      store.set(filePath, content);
      return ok(undefined);
    },
    async readSafe(filePath: string) {
      const v = store.get(filePath);
      if (v === undefined) return fail(new Error('not found'));
      return ok(v);
    },
    async copy(_src: string, _dest: string) {
      return ok(undefined);
    },
    async exists(filePath: string) {
      return store.has(filePath);
    },
    async stat(_filePath: string) {
      return ok({} as any);
    },
  };

  return { fs: { FileUtils, JsonFileHandler: MockJsonFileHandler } };
});

const makeManifest = (name: string): LlmManifest => ({
  schemaVersion: '1.0.0',
  name,
  language: 'node',
  entry: 'index.js',
  configSchema: { type: 'object', properties: {} },
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  description: `Manifest for ${name}`,
});

describe('FileBasedLlmBridgeRegistry (mocked FS)', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it('register/list/get/active/unregister lifecycle', async () => {
    const baseDir = '/tmp/agentos-core-test';
    const reg = new FileBasedLlmBridgeRegistry(baseDir, new LlmBridgeLoader());

    expect(await reg.listIds()).toEqual([]);
    expect(await reg.getActiveId()).toBeNull();

    const id1 = await reg.register(makeManifest('test-bridge'), {});
    expect(id1).toBe('test-bridge');
    expect((await reg.listIds()).sort()).toEqual(['test-bridge']);
    expect((await reg.getManifest('test-bridge'))?.name).toBe('test-bridge');
    expect(await reg.getActiveId()).toBe('test-bridge');

    const id2 = await reg.register(makeManifest('other-bridge'), {});
    expect(id2).toBe('other-bridge');
    expect((await reg.listIds()).sort()).toEqual(['other-bridge', 'test-bridge']);
    expect(await reg.getActiveId()).toBe('test-bridge');

    await reg.setActiveId('other-bridge');
    expect(await reg.getActiveId()).toBe('other-bridge');

    await reg.unregister('other-bridge');
    expect((await reg.listIds()).sort()).toEqual(['test-bridge']);
    expect(await reg.getActiveId()).toBe('test-bridge');

    await reg.unregister('test-bridge');
    expect(await reg.listIds()).toEqual([]);
    expect(await reg.getActiveId()).toBeNull();
  });
});
