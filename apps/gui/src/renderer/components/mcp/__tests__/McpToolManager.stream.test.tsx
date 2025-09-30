import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { MCPToolsManager } from '../McpToolManager';
import type { McpUsageUpdateEvent } from '../../../../shared/types/mcp-usage-types';
import { convertLegacyMcpUsageEvent } from '../../../../shared/types/mcp-usage-types';
import type { RpcClient } from '../../../../shared/rpc/transport';
import type { McpServiceAdapter } from '../../../rpc/adapters/mcp.adapter';
import { McpUsageRpcService } from '../../../rpc/services/mcp-usage.service';

/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */

describe('MCPToolsManager stream updates', () => {
  beforeEach(() => {
    ServiceContainer.clear();
  });

  it('prepends usage log and updates usage count when usage event arrives', async () => {
    const subscribers: Array<(event: McpUsageUpdateEvent) => void> = [];
    const baseDate = new Date('2025-09-20T00:00:00Z');

    const mcpService = {
      getAllToolMetadata: vi.fn().mockResolvedValue([
        {
          id: 'tool-1',
          name: 'Stream Tool',
          description: 'Streams intelligence',
          version: '1.0.0',
          category: 'analytics',
          provider: 'Acme',
          endpoint: 'https://example.com',
          permissions: [],
          status: 'connected',
          usageCount: 1,
          lastUsedAt: baseDate.toISOString(),
        },
      ]),
    };

    const transport: RpcClient = {
      async request<TRes = unknown>(): Promise<TRes> {
        return undefined as never as TRes;
      },
      on() {
        return async () => {};
      },
    };
    const usageService = new McpUsageRpcService(transport);
    Object.assign(usageService, {
      getAllUsageLogs: vi.fn().mockResolvedValue([]),
      subscribeToUsageUpdates: vi.fn(async (cb: (event: McpUsageUpdateEvent) => void) => {
        subscribers.push(cb);
        return () => {};
      }),
    });

    ServiceContainer.register('mcp', mcpService as unknown as McpServiceAdapter);
    ServiceContainer.register('mcpUsageLog', usageService);

    render(<MCPToolsManager />);

    await waitFor(() => expect(mcpService.getAllToolMetadata).toHaveBeenCalled());
    await waitFor(() => expect(subscribers.length).toBeGreaterThan(0));

    act(() => {
      const legacyEvent = {
        type: 'mcp.usage.log.created',
        payload: {
          id: 'log-1',
          toolId: 'tool-1',
          toolName: 'Stream Tool',
          clientName: 'Stream Tool',
          timestamp: new Date(),
          operation: 'tool.call',
          status: 'success',
          durationMs: 480,
          agentId: 'agent-42',
        },
      } as const;
      const converted = convertLegacyMcpUsageEvent(legacyEvent);
      if (!converted) {
        throw new Error('Expected legacy event to convert');
      }
      subscribers[0](converted as McpUsageUpdateEvent);
    });

    await waitFor(() => expect(screen.getByText(/Used by agent-42/i)).toBeInTheDocument());

    await waitFor(() => expect(screen.getByText('2 calls')).toBeInTheDocument());
  });
});
