import os from 'os';
import path from 'path';
import { FileBasedLlmBridgeRegistry } from './registry';
import type { LlmManifest } from 'llm-bridge-spec';

const mkTmp = () => path.join(os.tmpdir(), `agentos_core_llm_registry_${Date.now()}_${Math.random()}`);

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

describe('FileBasedLlmBridgeRegistry', () => {
  test('register/list/get/active/unregister lifecycle', async () => {
    const baseDir = mkTmp();
    const reg = new FileBasedLlmBridgeRegistry(baseDir);

    // Initially empty
    expect(await reg.listIds()).toEqual([]);
    expect(await reg.getActiveId()).toBeNull();

    // Register first bridge
    const id1 = await reg.register(makeManifest('test-bridge'));
    expect(id1).toBe('test-bridge');
    expect(await reg.listIds()).toEqual(['test-bridge']);
    const m1 = await reg.getManifest('test-bridge');
    expect(m1?.name).toBe('test-bridge');
    expect(await reg.getActiveId()).toBe('test-bridge');

    // Register second bridge
    const id2 = await reg.register(makeManifest('other-bridge'));
    expect(id2).toBe('other-bridge');
    const ids = await reg.listIds();
    expect(ids.sort()).toEqual(['other-bridge', 'test-bridge']);
    // Active remains first unless explicitly changed
    expect(await reg.getActiveId()).toBe('test-bridge');

    // Switch active
    await reg.setActiveId('other-bridge');
    expect(await reg.getActiveId()).toBe('other-bridge');

    // Unregister active -> should fallback to remaining
    await reg.unregister('other-bridge');
    expect(await reg.listIds()).toEqual(['test-bridge']);
    expect(await reg.getActiveId()).toBe('test-bridge');

    // Remove last bridge -> active cleared
    await reg.unregister('test-bridge');
    expect(await reg.listIds()).toEqual([]);
    expect(await reg.getActiveId()).toBeNull();
  });
});

