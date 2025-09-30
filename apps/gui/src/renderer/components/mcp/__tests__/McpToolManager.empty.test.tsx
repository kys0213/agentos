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
    async request<TRes = unknown>(): Promise<TRes> {
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

describe('MCPToolsManager empty/error states', () => {
  beforeEach(() => {
    ServiceContainer.clear();
  });

  it('renders empty state when no tools', async () => {
    const svc = { getAllToolMetadata: vi.fn().mockResolvedValue([]) };
    const usageSvc = createUsageService([]);
    ServiceContainer.register('mcp', svc as unknown as McpServiceAdapter);
    ServiceContainer.register('mcpUsageLog', usageSvc);
    render(<MCPToolsManager />);
    expect(await screen.findByText(/No MCP tools yet/i)).toBeInTheDocument();
    // reload triggers fetch again
    const btn = screen.getByRole('button', { name: /Reload Tools/i });
    await userEvent.click(btn);
    await waitFor(() => expect(svc.getAllToolMetadata).toHaveBeenCalledTimes(2));
  });

  it('handles service not available gracefully', async () => {
    // no registration → should show empty scaffolding without crash
    render(<MCPToolsManager />);
    expect(await screen.findByText(/No MCP tools yet/i)).toBeInTheDocument();
  });
});
