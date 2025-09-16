import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { MCPToolsManager } from '../McpToolManager';

/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */

describe('MCPToolsManager empty/error states', () => {
  beforeEach(() => {
    ServiceContainer.clear();
  });

  it('renders empty state when no tools', async () => {
    const svc = { getAllToolMetadata: vi.fn().mockResolvedValue([]) };
    // @ts-expect-error test double registration
    ServiceContainer.register('mcp', svc);
    render(<MCPToolsManager />);
    expect(await screen.findByText(/No tools found/i)).toBeInTheDocument();
    // refresh triggers fetch again
    const btn = screen.getAllByText('Refresh')[0];
    fireEvent.click(btn);
    // allow event loop
    await new Promise((r) => setTimeout(r, 0));
    expect(svc.getAllToolMetadata).toHaveBeenCalledTimes(2);
  });

  it('handles service not available gracefully', async () => {
    // no registration → should show empty scaffolding without crash
    render(<MCPToolsManager />);
    expect(await screen.findByText(/MCP Tool Manager/i)).toBeInTheDocument();
  });
});
