import { Test } from '@nestjs/testing';
import { GeneratedBridgeController as BridgeController } from '../gen/bridge.controller.gen.new';
import { LLM_BRIDGE_REGISTRY_TOKEN } from '../../common/model/constants';
import { z } from 'zod';

describe('BridgeController', () => {
  it('register returns success with id', async () => {
    const registry = {
      register: vi.fn().mockResolvedValue('id-1'),
      listSummaries: vi.fn(),
      getActiveId: vi.fn(),
      getManifest: vi.fn(),
      unregister: vi.fn(),
      setActiveId: vi.fn(),
    };

    const mod = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registry }],
    }).compile();

    const ctrl = mod.get(BridgeController);
    const manifest = {
      name: 'm',
      description: '',
      schemaVersion: '1',
      language: 'node',
      entry: 'index.js',
      configSchema: z.object({}),
      models: [],
      // vendor and license omitted per current manifest type
      capabilities: {
        modalities: ['text'] as Array<'text'>,
        supportsToolCall: false,
        supportsFunctionCall: false,
        supportsMultiTurn: false,
        supportsStreaming: false,
        supportsVision: false,
      },
    };
    const res = await ctrl.register({ manifest, config: {} });
    expect(res.success).toBe(true);
    if (!res.success) {
      throw new Error('expected success');
    }
    expect(res.id).toBe('id-1');
  });

  it('unregister wraps errors', async () => {
    const registry = {
      unregister: vi.fn().mockRejectedValue(new Error('nope')),
      listSummaries: vi.fn(),
      getActiveId: vi.fn(),
      getManifest: vi.fn(),
      register: vi.fn(),
      setActiveId: vi.fn(),
    };

    const mod = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registry }],
    }).compile();

    const ctrl = mod.get(BridgeController);
    const res = await ctrl.unregister('bad-id');
    expect(res.success).toBe(false);
  });

  it('get_current returns null or object', async () => {
    const manifest = {
      name: 'm',
      description: '',
      schemaVersion: '1',
      language: 'node',
      entry: 'index.js',
      configSchema: z.object({}),
      models: [],
      // vendor and license omitted per current manifest type
      capabilities: {
        modalities: ['text'] as Array<'text'>,
        supportsToolCall: false,
        supportsFunctionCall: false,
        supportsMultiTurn: false,
        supportsStreaming: false,
        supportsVision: false,
      },
    };
    const registry = {
      getActiveId: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('id-1'),
      getManifest: vi.fn().mockResolvedValue(manifest),
      listSummaries: vi.fn(),
      unregister: vi.fn(),
      register: vi.fn(),
      setActiveId: vi.fn(),
    };

    const mod = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registry }],
    }).compile();

    const ctrl = mod.get(BridgeController);
    const r1 = await ctrl.get_current();
    expect(r1).toBeNull();
    const r2 = await ctrl.get_current();
    expect(r2?.id).toBe('id-1');
    expect(r2?.manifest).toEqual(manifest);
  });

  it('switchActive wraps success/error', async () => {
    const registryOk = {
      setActiveId: vi.fn().mockResolvedValue(undefined),
      listSummaries: vi.fn(),
      getActiveId: vi.fn(),
      getManifest: vi.fn(),
      unregister: vi.fn(),
      register: vi.fn(),
    };
    const modOk = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registryOk }],
    }).compile();
    const ctrlOk = modOk.get(BridgeController);
    const ok = await ctrlOk.switch('id');
    expect(ok.success).toBe(true);

    const registryErr = {
      setActiveId: vi.fn().mockRejectedValue(new Error('bad')),
      listSummaries: vi.fn(),
      getActiveId: vi.fn(),
      getManifest: vi.fn(),
      unregister: vi.fn(),
      register: vi.fn(),
    };
    const modErr = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registryErr }],
    }).compile();
    const ctrlErr = modErr.get(BridgeController);
    const err = await ctrlErr.switch('id');
    expect(err.success).toBe(false);
  });
});
