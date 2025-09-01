import { Test } from '@nestjs/testing';
import { McpController } from '../mcp.controller';
import { McpService } from '@agentos/core';
import type { McpToolMetadata } from '@agentos/core';
import type { GetToolDto, InvokeToolDto, Resp } from '../dto/mcp.dto';

describe('McpController', () => {
  it('invokes tool via McpService and wraps response', async () => {
    const executeToolMock: jest.MockedFunction<McpService['executeTool']> = jest
      .fn()
      .mockResolvedValue({ isError: false, contents: [], resumptionToken: undefined });
    const getToolMock: jest.MockedFunction<McpService['getTool']> = jest.fn().mockReturnValue(null);
    const mockMcp: Pick<McpService, 'executeTool' | 'getTool'> = {
      executeTool: executeToolMock,
      getTool: getToolMock,
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [McpController],
      providers: [{ provide: McpService, useValue: mockMcp }],
    }).compile();

    const ctrl = moduleRef.get(McpController);
    const resp: Resp<unknown> = await ctrl.invokeTool({ name: 'foo.bar' } satisfies InvokeToolDto);
    expect(resp.success).toBe(true);
    expect(executeToolMock).toHaveBeenCalledWith('foo.bar', undefined, undefined);
  });

  it('wraps error as { success: false }', async () => {
    const executeToolMock: jest.MockedFunction<McpService['executeTool']> = jest
      .fn()
      .mockRejectedValue(new Error('boom'));
    const getToolMock: jest.MockedFunction<McpService['getTool']> = jest.fn().mockReturnValue(null);
    const mockMcp: Pick<McpService, 'executeTool' | 'getTool'> = {
      executeTool: executeToolMock,
      getTool: getToolMock,
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [McpController],
      providers: [{ provide: McpService, useValue: mockMcp }],
    }).compile();

    const ctrl = moduleRef.get(McpController);
    const resp: Resp<unknown> = await ctrl.invokeTool({ name: 'foo.bar' } satisfies InvokeToolDto);
    expect(resp.success).toBe(false);
  });

  it('getTool forwards name via DTO', async () => {
    const toolMeta: McpToolMetadata = {
      id: 't1',
      name: 'foo.bar',
      description: '',
      version: '1.0.0',
      permissions: [],
      status: 'connected',
      usageCount: 0,
    };
    const getToolMock: jest.MockedFunction<McpService['getTool']> = jest
      .fn()
      .mockReturnValue(toolMeta);
    const executeToolMock: jest.MockedFunction<McpService['executeTool']> = jest.fn();
    const mockMcp: Pick<McpService, 'executeTool' | 'getTool'> = {
      getTool: getToolMock,
      executeTool: executeToolMock,
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [McpController],
      providers: [{ provide: McpService, useValue: mockMcp }],
    }).compile();

    const ctrl = moduleRef.get(McpController);
    const tool = await ctrl.getTool({ name: 'foo.bar' } satisfies GetToolDto);
    expect(tool?.id).toEqual('t1');
    expect(getToolMock).toHaveBeenCalledWith('foo.bar');
  });
});
