import type { BridgeLoader } from 'llm-bridge-loader';
import type { LlmBridgePrompt, LlmBridgeResponse, LlmManifest, LlmMetadata } from 'llm-bridge-spec';
import z from 'zod';
import { FileBasedLlmBridgeRegistry } from '../file-based-llm-bridge-registry';
import path from 'node:path';
import { LlmBridgeLoader } from './__mocks__/llm-bridge-loader';
import { DummyBridge } from './__mocks__/dummy-bridge';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory file store to mock @agentos/lang/fs layer deterministically
const store = new Map<string, string>();

// Helper to extract filename from path
const filenameOf = (p: string) => path.basename(p);

vi.mock('@agentos/lang/fs', () => {
  const ok = (result: unknown) => ({ success: true as const, result });
  const fail = (reason: unknown) => ({ success: false as const, reason });

  const createMockJsonFileHandler = (filePath: string) => {
    return {
      async read(options: { useDefaultOnError?: boolean; defaultValue?: unknown } = {}) {
        const content = store.get(filePath);
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
      },
      async write(data: unknown) {
        try {
          store.set(filePath, JSON.stringify(data));
          return ok(undefined);
        } catch (e) {
          return fail(e);
        }
      },
    };
  };

  const JsonFileHandler = {
    create(filePath: string) {
      return createMockJsonFileHandler(filePath);
    },
  };

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
      if (v === undefined) {
        return fail(new Error('not found'));
      }
      return ok(v);
    },
    async copy(_src: string, _dest: string) {
      return ok(undefined);
    },
    async exists(filePath: string) {
      return store.has(filePath);
    },
    async stat(_filePath: string) {
      return ok({} as Record<string, unknown>);
    },
  };

  return { FileUtils, JsonFileHandler };
});

const makeManifest = (name: string): LlmManifest => ({
  schemaVersion: '1.0.0',
  name,
  language: 'node',
  entry: 'index.js',
  configSchema: z.object({}),
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  models: [],
  description: `Manifest for ${name}`,
});

describe('FileBasedLlmBridgeRegistry (mocked FS)', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('register/list/get/active/unregister lifecycle', async () => {
    const baseDir = '/tmp/agentos-core-test';
    const reg = new FileBasedLlmBridgeRegistry(baseDir, new LlmBridgeLoader());
    await reg.loadBridge('test-bridge');

    expect(await reg.listIds()).toEqual([]);
    expect(await reg.getActiveId()).toBeNull();

    const id1 = await reg.register(makeManifest('test-bridge'), {});
    expect(id1).toBe('test-bridge');
    expect((await reg.listIds()).sort()).toEqual(['test-bridge']);
    expect((await reg.getManifest('test-bridge'))?.name).toBe('test-bridge');
    expect(await reg.getActiveId()).toBe('test-bridge');

    await reg.loadBridge('other-bridge');
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

  it('hydrates existing bridge instances from disk on demand', async () => {
    const baseDir = '/tmp/agentos-core-hydrate';
    const initial = new FileBasedLlmBridgeRegistry(baseDir, new LlmBridgeLoader());
    await initial.loadBridge('persisted-bridge');
    await initial.register(makeManifest('persisted-bridge'), {});

    const reloaded = new FileBasedLlmBridgeRegistry(baseDir, new LlmBridgeLoader());
    const bridgeByName = await reloaded.getBridgeByName('persisted-bridge');
    expect(bridgeByName).toBeInstanceOf(DummyBridge);

    const bridgeById = await reloaded.getBridge('persisted-bridge');
    expect(bridgeById).toBeInstanceOf(DummyBridge);
  });

  it('listSummaries reflects configured state and hides missing dependencies', async () => {
    const baseDir = '/tmp/agentos-core-summary';
    const loader = new LlmBridgeLoader();
    const reg = new FileBasedLlmBridgeRegistry(baseDir, loader);

    await reg.ensureManifestRecord(makeManifest('pending-bridge'));
    await reg.loadBridge('ready-bridge');
    await reg.register(makeManifest('ready-bridge'), {});

    const summaries = await reg.listSummaries();
    expect(summaries).toHaveLength(2);
    const pending = summaries.find((s) => s.id === 'pending-bridge');
    const ready = summaries.find((s) => s.id === 'ready-bridge');
    expect(pending?.configured).toBe(false);
    expect(ready?.configured).toBe(true);

    const failingLoader = new LlmBridgeLoader();
    const originalLoad = failingLoader.load.bind(failingLoader);
    failingLoader.load = async (name: string) => {
      if (name === 'pending-bridge') {
        throw new Error('missing');
      }
      return originalLoad(name);
    };

    const regWithMissing = new FileBasedLlmBridgeRegistry(baseDir, failingLoader);
    const filtered = await regWithMissing.listSummaries();
    expect(filtered.map((s) => s.id)).toEqual(['ready-bridge']);
  });

  it('uses static create factory when bridge exposes it', async () => {
    const baseDir = '/tmp/agentos-core-factory';
    const createSpy = vi.fn();

    const manifest = {
      ...makeManifest('factory-bridge'),
      configSchema: z.object({ model: z.string() }),
    };

    interface FactoryConfig {
      model: string;
    }

    class FactoryBridge {
      static manifest() {
        return manifest;
      }

      static create(config: FactoryConfig) {
        createSpy(config);
        return new FactoryBridge(config);
      }

      constructor(private readonly config: FactoryConfig) {}

      async invoke(_prompt: LlmBridgePrompt): Promise<LlmBridgeResponse> {
        return {
          content: { contentType: 'text', value: `model:${this.config.model}` },
        };
      }

      async getMetadata(): Promise<LlmMetadata> {
        return {
          name: 'factory-bridge',
          description: 'Factory bridge for tests',
          model: this.config.model,
          contextWindow: 0,
          maxTokens: 0,
        };
      }
    }

    const loader: BridgeLoader = {
      scan: vi.fn().mockResolvedValue([]),
      load: vi.fn().mockResolvedValue({
        ctor: FactoryBridge,
        manifest,
        configSchema: manifest.configSchema,
      }),
    };

    const registry = new FileBasedLlmBridgeRegistry(baseDir, loader);
    const bridgeId = await registry.register(manifest, { model: 'llama3.2' });

    expect(bridgeId).toBe('factory-bridge');
    expect(createSpy).toHaveBeenCalledWith({ model: 'llama3.2' });

    const bridge = await registry.getBridge(bridgeId);
    expect(bridge).toBeInstanceOf(FactoryBridge);
  });
});
