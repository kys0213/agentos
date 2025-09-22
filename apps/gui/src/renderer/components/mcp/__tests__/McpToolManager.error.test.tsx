import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceContainer } from '../../../../shared/di/service-container';
import type { McpServiceAdapter } from '../../../rpc/adapters/mcp.adapter';

import { MCPToolsManager } from '../McpToolManager';
import type { RpcClient } from '../../../../shared/rpc/transport';
import { McpUsageRpcService } from '../../../rpc/services/mcp-usage.service';

/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */

const createUsageService = (logs: unknown[]) => {
  const transport: RpcClient = {
    async request<TRes = unknown, _TReq = unknown>(): Promise<TRes> {
      return undefined as never as TRes;
    },
    on() {
      return async () => {};
    },
  };
  const svc = new McpUsageRpcService(transport);
  Object.assign(svc, {
    getAllUsageLogs: vi.fn().mockResolvedValue(logs),
    subscribeToUsageUpdates: vi.fn(async () => () => {}),
  });
  return svc;
};

describe('MCPToolsManager error path', () => {
  beforeEach(() => ServiceContainer.clear());

  it('shows empty scaffolding and allows retry after error', async () => {
    const svc = { getAllToolMetadata: vi.fn().mockRejectedValue(new Error('boom')) };
    const usageSvc = createUsageService([]);
    ServiceContainer.register('mcp', svc as unknown as McpServiceAdapter);
    ServiceContainer.register('mcpUsageLog', usageSvc);
    render(<MCPToolsManager />);

    // Header renders even on error
    expect(await screen.findByText(/MCP Tool Manager/i)).toBeInTheDocument();
    const refresh = screen.getAllByText('Refresh')[0];
    await userEvent.click(refresh);
    await waitFor(() => expect(svc.getAllToolMetadata).toHaveBeenCalledTimes(2));
  });
});
