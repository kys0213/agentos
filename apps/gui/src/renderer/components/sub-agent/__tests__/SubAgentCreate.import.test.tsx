import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { withProviders } from '../../../../test/test-utils';
import type { CreateAgentMetadata } from '@agentos/core';
import { SubAgentCreate } from '../SubAgentCreate';

vi.mock('../../../hooks/queries/use-mcp', () => ({
  useMcpTools: () => ({ data: { items: [] }, isLoading: false }),
}));

describe('SubAgentCreate Import JSON', () => {
  const noop = () => {};
  const onCreate: (agent: CreateAgentMetadata) => void = () => {};

  it('shows error for invalid JSON', async () => {
    render(withProviders(<SubAgentCreate onBack={noop} onCreate={onCreate} presets={[]} />));

    // Switch to Settings tab
    // Go to Settings tab to access Import section
    await userEvent.click(await screen.findByRole('tab', { name: /settings/i }));

    const textarea = await screen.findByPlaceholderText(/Paste exported agent JSON here/i);
    await userEvent.clear(textarea);
    fireEvent.change(textarea, { target: { value: 'not a json' } });

    await userEvent.click(screen.getByRole('button', { name: /apply/i }));

    // Error message should appear
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it('applies valid JSON and updates system prompt', async () => {
    render(withProviders(<SubAgentCreate onBack={noop} onCreate={onCreate} presets={[]} />));

    // Go to Settings tab to access Import section
    await userEvent.click(await screen.findByRole('tab', { name: /settings/i }));
    const importArea = await screen.findByPlaceholderText(/Paste exported agent JSON here/i);

    const json = JSON.stringify({
      name: 'Agent X',
      description: 'D',
      status: 'active',
      keywords: [],
      preset: {
        name: 'P1',
        description: 'PD',
        systemPrompt: 'NEW PROMPT',
        enabledMcps: [],
        llmBridgeName: 'bridge',
        llmBridgeConfig: {},
      },
    });

    await userEvent.clear(importArea);
    fireEvent.change(importArea, { target: { value: json } });
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));

    // After applying import, verify the system prompt in AI Config tab
    await userEvent.click(await screen.findByRole('tab', { name: /ai config/i }));
    const systemPromptArea = await screen.findByPlaceholderText(/guides your agent's behavior/i);
    expect(systemPromptArea).toHaveValue('NEW PROMPT');
  });
});
