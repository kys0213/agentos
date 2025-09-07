import 'reflect-metadata';
import { GeneratedMcpController as McpController } from '../gen/mcp.controller.gen.new';
import { McpService } from '@agentos/core';
import { McpUsageService } from '@agentos/core';
import { OutboundChannel } from '../../common/event/outbound-channel';
import type { GetToolDto, InvokeToolDto } from '../dto/mcp.dto';
import { GeneratedMcpController as McpController } from '../gen/mcp.controller.gen.new';

describe('McpController', () => {
  it('invokes tool via McpService and wraps response', async () => {
    const executeToolMock: McpService['executeTool'] = vi
      .fn()
      .mockResolvedValue({ isError: false, contents: [], resumptionToken: undefined });
    const getToolMock: McpService['getTool'] = vi.fn().mockReturnValue(null);
    const mockMcp: Pick<McpService, 'executeTool' | 'getTool'> = {
      executeTool: executeToolMock,
      getTool: getToolMock,
    };

    const mcp = Object.assign(
      Object.create((McpService as { prototype: object }).prototype),
      mockMcp
    ) as McpService;
    const usage = Object.assign(
      Object.create((McpUsageService as { prototype: object }).prototype),
      { list: vi.fn(), getStats: vi.fn() }
    ) as McpUsageService;
    const outbound = Object.assign(
      Object.create((OutboundChannel as { prototype: object }).prototype),
      { ofType: vi.fn() }
    ) as OutboundChannel;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance; acceptable exception with rationale
    const mcp = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((McpService as { prototype: object }).prototype),
      mockMcp
    ) as McpService;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const usage = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((McpUsageService as { prototype: object }).prototype),
      { list: vi.fn(), getStats: vi.fn() }
    ) as McpUsageService;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const outbound = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((OutboundChannel as { prototype: object }).prototype),
      { ofType: vi.fn() }
    ) as OutboundChannel;
    const ctrl = new McpController(mcp, usage, outbound);
    const resp = await ctrl.invokeTool({ name: 'foo.bar' } satisfies InvokeToolDto);
    expect(resp.success).toBe(true);
    expect(executeToolMock).toHaveBeenCalledWith('foo.bar', undefined, {
      agentId: undefined,
      sessionId: undefined,
    });
  });

  it('wraps error as { success: false }', async () => {
    const executeToolMock: McpService['executeTool'] = vi.fn().mockRejectedValue(new Error('boom'));
    const executeToolMock: McpService['executeTool'] = vi.fn().mockRejectedValue(new Error('boom'));
    const getToolMock: McpService['getTool'] = vi.fn().mockReturnValue(null);
    const mockMcp: Pick<McpService, 'executeTool' | 'getTool'> = {
      executeTool: executeToolMock,
      getTool: getToolMock,
    };

    const mcp = Object.assign(
      Object.create((McpService as { prototype: object }).prototype),
      mockMcp
    ) as McpService;
    const usage = Object.assign(
      Object.create((McpUsageService as { prototype: object }).prototype),
      { list: vi.fn(), getStats: vi.fn() }
    ) as McpUsageService;
    const outbound = Object.assign(
      Object.create((OutboundChannel as { prototype: object }).prototype),
      { ofType: vi.fn() }
    ) as OutboundChannel;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const mcp = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((McpService as { prototype: object }).prototype),
      mockMcp
    ) as McpService;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const usage = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((McpUsageService as { prototype: object }).prototype),
      { list: vi.fn(), getStats: vi.fn() }
    ) as McpUsageService;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const outbound = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((OutboundChannel as { prototype: object }).prototype),
      { ofType: vi.fn() }
    ) as OutboundChannel;
    const ctrl = new McpController(mcp, usage, outbound);
    const resp = await ctrl.invokeTool({ name: 'foo.bar' } satisfies InvokeToolDto);
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
    const getToolMock: McpService['getTool'] = vi.fn().mockReturnValue(toolMeta);
    const getToolMock: McpService['getTool'] = vi.fn().mockReturnValue(toolMeta);
    const executeToolMock: McpService['executeTool'] = vi.fn();
    const mockMcp: Pick<McpService, 'executeTool' | 'getTool'> = {
      getTool: getToolMock,
      executeTool: executeToolMock,
    };

    const mcp = Object.assign(
      Object.create((McpService as { prototype: object }).prototype),
      mockMcp
    ) as McpService;
    const usage = Object.assign(
      Object.create((McpUsageService as { prototype: object }).prototype),
      { list: vi.fn(), getStats: vi.fn() }
    ) as McpUsageService;
    const outbound = Object.assign(
      Object.create((OutboundChannel as { prototype: object }).prototype),
      { ofType: vi.fn() }
    ) as OutboundChannel;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const mcp = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((McpService as { prototype: object }).prototype),
      mockMcp
    ) as McpService;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const usage = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((McpUsageService as { prototype: object }).prototype),
      { list: vi.fn(), getStats: vi.fn() }
    ) as McpUsageService;
    // eslint-disable-next-line no-restricted-syntax -- test double needs prototype-linked instance
    const outbound = Object.assign(
      // eslint-disable-next-line no-restricted-syntax -- typing prototype for structural mock
      Object.create((OutboundChannel as { prototype: object }).prototype),
      { ofType: vi.fn() }
    ) as OutboundChannel;
    const ctrl = new McpController(mcp, usage, outbound);
    const tool = await ctrl.getTool({ name: 'foo.bar' } satisfies GetToolDto);
    // eslint-disable-next-line no-restricted-syntax -- accessing optional id for assertion in test
    const t = tool as { id?: string };
    expect(t?.id).toEqual('t1');
    expect(getToolMock).toHaveBeenCalledWith('foo.bar');
  });
});
