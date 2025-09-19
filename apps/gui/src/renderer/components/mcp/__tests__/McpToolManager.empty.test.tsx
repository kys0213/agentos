import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { MCPToolsManager } from '../McpToolManager';

/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */

describe('MCPToolsManager empty/error states', () => {
  beforeEach(() => {
    ServiceContainer.clear();
  });

  it('renders empty state when no tools', async () => {
    const svc = { getAllToolMetadata: vi.fn().mockResolvedValue([]) };
    const usageSvc = { getAllUsageLogs: vi.fn().mockResolvedValue([]) };
    // @ts-expect-error test double registration
    ServiceContainer.register('mcp', svc);
    // @ts-expect-error test double registration
    ServiceContainer.register('mcpUsageLog', usageSvc);
    await act(async () => {
      render(<MCPToolsManager />);
    });
    expect(await screen.findByText(/No tools found/i)).toBeInTheDocument();
    // refresh triggers fetch again
    const btn = screen.getAllByText('Refresh')[0];
    await userEvent.click(btn);
    await waitFor(() => expect(svc.getAllToolMetadata).toHaveBeenCalledTimes(2));
  });

  it('handles service not available gracefully', async () => {
    // no registration → should show empty scaffolding without crash
    await act(async () => {
      render(<MCPToolsManager />);
    });
    expect(await screen.findByText(/No registered tools/i)).toBeInTheDocument();
  });
});
