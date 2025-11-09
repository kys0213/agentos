import React from 'react';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReadonlyAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { withProviders } from '../../../../test/test-utils';
import { SubAgentManager } from '../SubAgentManager';

describe('SubAgentManager export/import actions', () => {
  const basePreset: ReadonlyPreset = {
    id: 'preset-1',
    name: 'Default Assistant',
    description: 'Standard assistant configuration',
    author: 'System',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: 'You are helpful.',
    enabledMcps: [],
    llmBridgeName: 'openai',
    llmBridgeConfig: {},
    status: 'active' as const,
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: [],
  };

  const agent: ReadonlyAgentMetadata = {
    id: 'agent-1',
    name: 'Agent One',
    description: 'Example agent',
    status: 'active',
    icon: '😀',
    keywords: ['general'],
    preset: basePreset,
    usageCount: 0,
    sessionCount: 0,
    lastUsed: new Date('2024-01-01T00:00:00Z'),
  } as ReadonlyAgentMetadata;

  const originalClipboard = navigator.clipboard;
  const originalResizeObserver = global.ResizeObserver;
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

  beforeAll(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    if (typeof globalThis.ResizeObserver === 'undefined') {
      const ResizeObserverMock = class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      };
      Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        writable: true,
        value: ResizeObserverMock,
      });
    }
  });

  afterAll(() => {
    alertSpy.mockRestore();
    Object.assign(navigator, { clipboard: originalClipboard });
    if (originalResizeObserver) {
      Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        writable: true,
        value: originalResizeObserver,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    }
  });

  it('should trigger export callback when selecting Export JSON', async () => {
    const onExportAgent = vi.fn().mockResolvedValue('{"name":"Agent"}');

    render(
      withProviders(
        <SubAgentManager
          agents={[agent]}
          onUpdateAgentStatus={() => undefined}
          onExportAgent={onExportAgent}
        />
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /agent actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /export json/i }));

    expect(onExportAgent).toHaveBeenCalledWith('agent-1');
  });

  it('should open import dialog and submit JSON payload', async () => {
    const onImportAgent = vi.fn().mockResolvedValue(undefined);

    render(
      withProviders(
        <SubAgentManager
          agents={[agent]}
          onUpdateAgentStatus={() => undefined}
          onImportAgent={onImportAgent}
        />
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /agent actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /import json/i }));

    const textarea = await screen.findByPlaceholderText('{"name": "Agent", ...}');
    const payload = JSON.stringify({
      name: 'Agent One',
      description: 'Updated description',
      status: 'active',
      keywords: [],
      preset: {
        name: 'P1',
        description: 'PD',
        systemPrompt: 'PROMPT',
        enabledMcps: [],
        llmBridgeName: 'bridge',
        llmBridgeConfig: {},
      },
    });

    await userEvent.clear(textarea);
    fireEvent.change(textarea, { target: { value: payload } });

    await userEvent.click(screen.getByRole('button', { name: /import json/i }));

    expect(onImportAgent).toHaveBeenCalledWith('agent-1', payload);
  });
});
