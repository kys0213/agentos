import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { withProviders } from '../../../../test/test-utils';
import { SubAgentCreate } from '../SubAgentCreate';

vi.mock('../../../hooks/queries/use-mcp', () => ({
  useMcpTools: () => ({ data: { items: [] }, isLoading: false })
}));

describe('SubAgentCreate Import JSON', () => {
  const noop = () => {};

  it('shows error for invalid JSON', async () => {
    render(withProviders(
      <SubAgentCreate onBack={noop} onCreate={noop as any} presets={[]} />
    ));

    // Switch to Settings tab
    await userEvent.click(await screen.findByRole('tab', { name: /settings/i }));

    const textarea = await screen.findByPlaceholderText(/Paste exported agent JSON here/i);
    await userEvent.type(textarea, 'not a json');

    await userEvent.click(screen.getByRole('button', { name: /apply/i }));

    // Error message should appear
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it('applies valid JSON and updates system prompt', async () => {
    render(withProviders(
      <SubAgentCreate onBack={noop} onCreate={noop as any} presets={[]} />
    ));

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
        llmBridgeConfig: {}
      }
    });

    await userEvent.clear(importArea);
    await userEvent.type(importArea, json);
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));

    const systemPromptArea = await screen.findByPlaceholderText(/guides your agent's behavior/i);
    expect(systemPromptArea).toHaveValue('NEW PROMPT');
  });
});
