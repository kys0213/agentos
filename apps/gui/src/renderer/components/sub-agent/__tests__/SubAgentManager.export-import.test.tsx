import React from 'react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReadonlyAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { withProviders } from '../../../../test/test-utils';
import { SubAgentManager } from '../SubAgentManager';
import { EXPORT_IMPORT_MESSAGES } from '../../../constants/export-import-messages';

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
  let clipboardWriteMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardWriteMock,
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

  beforeEach(() => {
    clipboardWriteMock.mockClear();
    clipboardWriteMock.mockResolvedValue(undefined);
  });

  afterAll(() => {
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

  it('copies JSON to clipboard and surfaces success toast', async () => {
    const onExportAgent = vi.fn().mockResolvedValue('{"name":"Agent One"}');

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
    expect(clipboardWriteMock).toHaveBeenCalledWith(expect.stringContaining('"Agent One"'));
    await screen.findByText(EXPORT_IMPORT_MESSAGES.EXPORT_SUCCESS);
  });

  it('opens manual copy dialog when clipboard write fails', async () => {
    const onExportAgent = vi.fn().mockResolvedValue('{"name":"Agent One"}');
    clipboardWriteMock.mockRejectedValueOnce(new Error('denied'));

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

    expect(await screen.findByText('Manual Export Copy')).toBeInTheDocument();
    const exportTextarea = screen.getByLabelText(/Export JSON for/i) as HTMLTextAreaElement;
    expect(exportTextarea.value).toContain('Agent One');
    await screen.findByText('Clipboard unavailable');
  });

  it('submits import payload when valid JSON is provided', async () => {
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

    const importButton = screen.getByRole('button', { name: /Import JSON for Agent One/i });
    await userEvent.click(importButton);

    expect(onImportAgent).toHaveBeenCalledWith('agent-1', payload);
    await screen.findByText(EXPORT_IMPORT_MESSAGES.IMPORT_SUCCESS);
  });

  it('shows validation error when attempting import without payload', async () => {
    render(
      withProviders(
        <SubAgentManager
          agents={[agent]}
          onUpdateAgentStatus={() => undefined}
          onImportAgent={vi.fn().mockResolvedValue(undefined)}
        />
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /agent actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /import json/i }));

    const importButton = screen.getByRole('button', { name: /Import JSON for Agent One/i });
    await userEvent.click(importButton);

    expect(await screen.findByText(EXPORT_IMPORT_MESSAGES.IMPORT_EMPTY)).toBeInTheDocument();
  });

  it('surfaces backend error message when import handler rejects', async () => {
    const onImportAgent = vi.fn().mockRejectedValue(new Error(EXPORT_IMPORT_MESSAGES.INVALID_JSON));

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
    fireEvent.change(textarea, { target: { value: '{"invalid": true}' } });

    const importButton = screen.getByRole('button', { name: /Import JSON for Agent One/i });
    await userEvent.click(importButton);

    const errorMessages = await screen.findAllByText(EXPORT_IMPORT_MESSAGES.INVALID_JSON);
    expect(errorMessages.length).toBeGreaterThanOrEqual(1);
  });
});
