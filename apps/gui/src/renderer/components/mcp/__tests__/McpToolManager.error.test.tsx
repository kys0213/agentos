import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { MCPToolsManager } from '../McpToolManager';

/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */

describe('MCPToolsManager error path', () => {
  beforeEach(() => ServiceContainer.clear());

  it('shows empty scaffolding and allows retry after error', async () => {
    const svc = { getAllToolMetadata: vi.fn().mockRejectedValue(new Error('boom')) };
    // @ts-expect-error test double
    ServiceContainer.register('mcp', svc);
    render(<MCPToolsManager />);

    // Header renders even on error
    expect(await screen.findByText(/MCP Tool Manager/i)).toBeInTheDocument();
    const refresh = screen.getAllByText('Refresh')[0];
    fireEvent.click(refresh);
    await new Promise((r) => setTimeout(r, 0));
    expect(svc.getAllToolMetadata).toHaveBeenCalledTimes(2);
  });
});
