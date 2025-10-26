import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReadonlyPreset } from '@agentos/core';
import { withProviders } from '../../../../test/test-utils';
import { SubAgentCreate } from '../SubAgentCreate';

vi.mock('../../preset/BridgeModelSettings', () => ({
  default: () => <div data-testid="mock-bridge-settings" />,
}));

vi.mock('../../../hooks/queries/use-mcp', () => ({
  useMcpTools: () => ({
    data: {
      items: [
        { id: 'filesystem', name: 'Filesystem', description: 'FS access', status: 'connected' },
      ],
    },
    isLoading: false,
  }),
}));

describe('SubAgentCreate wizard flow', () => {
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
    llmBridgeConfig: { bridgeId: 'openai', model: 'gpt-4' },
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: ['general'],
  };

  const noop = () => {};

  const setup = (overrides: Partial<React.ComponentProps<typeof SubAgentCreate>> = {}) =>
    render(
      withProviders(
        <SubAgentCreate
          onBack={noop}
          onCreate={overrides.onCreate ?? noop}
          presetTemplate={basePreset}
        />
      )
    );

  it('allows tab navigation between steps', async () => {
    setup();

    await userEvent.click(screen.getByRole('tab', { name: 'AI Config' }));
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('alerts and focuses the first invalid step when required fields are missing', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    setup();

    const headerCreateButton = screen.getByRole('button', { name: 'Create Agent' });
    expect(headerCreateButton).not.toBeDisabled();

    await userEvent.click(headerCreateButton);

    expect(alertSpy).toHaveBeenCalledWith('Agent name is required.');
    expect(screen.getByText('Agent name is required.')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it('submits once all required fields are filled', async () => {
    const onCreate = vi.fn();
    setup({ onCreate });

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Ready Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Fully configured agent');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));

    await userEvent.click(screen.getByTestId('btn-submit-agent'));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('notifies parent when step changes in controlled mode', async () => {
    const onStepChange = vi.fn();
    const view = withProviders(
      <SubAgentCreate
        onBack={noop}
        onCreate={noop}
        presetTemplate={basePreset}
        currentStepId="overview"
        onStepChange={onStepChange}
      />
    );
    const { rerender } = render(view);

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Controlled Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Ensures controlled step flow');

    await userEvent.click(screen.getByRole('button', { name: /Next: Category/i }));
    expect(onStepChange).toHaveBeenCalledWith('category');

    rerender(
      withProviders(
        <SubAgentCreate
          onBack={noop}
          onCreate={noop}
          presetTemplate={basePreset}
          currentStepId="category"
          onStepChange={onStepChange}
        />
      )
    );

    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
  });
});
