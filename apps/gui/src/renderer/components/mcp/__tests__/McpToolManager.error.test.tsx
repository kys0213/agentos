import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { MCPToolsManager } from '../McpToolManager';

/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */

describe('MCPToolsManager error path', () => {
  beforeEach(() => ServiceContainer.clear());

  it('shows empty scaffolding and allows retry after error', async () => {
    const svc = { getAllToolMetadata: vi.fn().mockRejectedValue(new Error('boom')) };
    const usageSvc = { getAllUsageLogs: vi.fn().mockResolvedValue([]) };
    // @ts-expect-error test double
    ServiceContainer.register('mcp', svc);
    // @ts-expect-error test double
    ServiceContainer.register('mcpUsageLog', usageSvc);
    await act(async () => {
      render(<MCPToolsManager />);
    });

    // Header renders even on error
    expect(await screen.findByText(/MCP Tool Manager/i)).toBeInTheDocument();
    const refresh = screen.getAllByText('Refresh')[0];
    await userEvent.click(refresh);
    await waitFor(() => expect(svc.getAllToolMetadata).toHaveBeenCalledTimes(2));
  });
});
