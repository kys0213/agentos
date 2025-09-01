import { Test } from '@nestjs/testing';
import { BridgeController } from '../bridge.controller';
import { LLM_BRIDGE_REGISTRY_TOKEN } from '../../common/model/constants';
import type { LlmManifest } from 'llm-bridge-spec';
import { z } from 'zod';
import type { Resp } from '../dto/bridge.dto';

describe('BridgeController', () => {
  it('register returns success wrapper with id', async () => {
    const registry = {
      register: jest.fn().mockResolvedValue('id-1'),
      listSummaries: jest.fn(),
      getActiveId: jest.fn(),
      getManifest: jest.fn(),
      unregister: jest.fn(),
      setActiveId: jest.fn(),
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
    const res: Resp<{ id: string }> = await ctrl.register({ manifest, config: {} });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.result.id).toBe('id-1');
    } else {
      throw new Error('expected success');
    }
  });

  it('unregister wraps errors', async () => {
    const registry = {
      unregister: jest.fn().mockRejectedValue(new Error('nope')),
      listSummaries: jest.fn(),
      getActiveId: jest.fn(),
      getManifest: jest.fn(),
      register: jest.fn(),
      setActiveId: jest.fn(),
    };

    const mod = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registry }],
    }).compile();

    const ctrl = mod.get(BridgeController);
    const res = await ctrl.unregister('bad-id');
    expect(res.success).toBe(false);
  });

  it('getCurrent returns null or object', async () => {
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
      getActiveId: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('id-1'),
      getManifest: jest.fn().mockResolvedValue(manifest),
      listSummaries: jest.fn(),
      unregister: jest.fn(),
      register: jest.fn(),
      setActiveId: jest.fn(),
    };

    const mod = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registry }],
    }).compile();

    const ctrl = mod.get(BridgeController);
    const r1 = await ctrl.getCurrent();
    expect(r1).toBeNull();
    const r2 = await ctrl.getCurrent();
    expect(r2?.id).toBe('id-1');
    expect(r2?.manifest).toEqual(manifest);
  });

  it('switchActive wraps success/error', async () => {
    const registryOk = {
      setActiveId: jest.fn().mockResolvedValue(undefined),
      listSummaries: jest.fn(),
      getActiveId: jest.fn(),
      getManifest: jest.fn(),
      unregister: jest.fn(),
      register: jest.fn(),
    };
    const modOk = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registryOk }],
    }).compile();
    const ctrlOk = modOk.get(BridgeController);
    const ok = await ctrlOk.switchActive('id');
    expect(ok.success).toBe(true);

    const registryErr = {
      setActiveId: jest.fn().mockRejectedValue(new Error('bad')),
      listSummaries: jest.fn(),
      getActiveId: jest.fn(),
      getManifest: jest.fn(),
      unregister: jest.fn(),
      register: jest.fn(),
    };
    const modErr = await Test.createTestingModule({
      controllers: [BridgeController],
      providers: [{ provide: LLM_BRIDGE_REGISTRY_TOKEN, useValue: registryErr }],
    }).compile();
    const ctrlErr = modErr.get(BridgeController);
    const err = await ctrlErr.switchActive('id');
    expect(err.success).toBe(false);
  });
});
