import { Test } from '@nestjs/testing';
import { McpController } from '../mcp.controller';
import type { McpService } from '@agentos/core';

describe('McpController', () => {
  it('invokes tool via McpService and wraps response', async () => {
    const mockMcp: Partial<Record<keyof McpService, any>> = {
      executeTool: jest.fn().mockResolvedValue({ isError: false, contents: [], resumptionToken: undefined }),
      getTool: jest.fn().mockReturnValue(null),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [McpController],
      providers: [{ provide: (require('@agentos/core') as any).McpService, useValue: mockMcp }],
    }).compile();

    const ctrl = moduleRef.get(McpController);
    const resp: any = await ctrl.invokeTool({ name: 'foo.bar' } as any);
    expect(resp.success).toBe(true);
    expect((mockMcp.executeTool as any)).toHaveBeenCalledWith('foo.bar', undefined, undefined);
  });

  it('wraps error as { success: false }', async () => {
    const mockMcp: Partial<Record<keyof McpService, any>> = {
      executeTool: jest.fn().mockRejectedValue(new Error('boom')),
      getTool: jest.fn().mockReturnValue(null),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [McpController],
      providers: [{ provide: (require('@agentos/core') as any).McpService, useValue: mockMcp }],
    }).compile();

    const ctrl = moduleRef.get(McpController);
    const resp: any = await ctrl.invokeTool({ name: 'foo.bar' } as any);
    expect(resp.success).toBe(false);
  });
});

