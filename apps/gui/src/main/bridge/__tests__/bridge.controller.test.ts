import { Test } from '@nestjs/testing';
import { BridgeController } from '../bridge.controller';
import { LLM_BRIDGE_REGISTRY_TOKEN } from '../../common/model/constants';

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
    const res: any = await ctrl.register({ manifest: { name: 'm', version: '1.0.0' } as any, config: {} } as any);
    expect(res.success).toBe(true);
    expect(res.result.id).toBe('id-1');
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
    const res: any = await ctrl.unregister('bad-id');
    expect(res.success).toBe(false);
  });
});

