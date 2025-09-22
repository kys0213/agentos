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

  const setup = () =>
    render(
      withProviders(<SubAgentCreate onBack={noop} onCreate={noop} presetTemplate={basePreset} />)
    );

  it('locks later steps until the previous step is validated', async () => {
    setup();

    const aiConfigTab = screen.getByRole('tab', { name: 'AI Config' });
    expect(aiConfigTab).toHaveAttribute('data-disabled');

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Step Tester');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Verifies wizard gating');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /Development.*software engineering/i,
      })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    const aiConfigTabEnabled = screen.getByRole('tab', { name: 'AI Config' });
    expect(aiConfigTabEnabled).not.toHaveAttribute('data-disabled');
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
  });

  it('keeps the create action disabled until all required fields are valid', async () => {
    setup();

    const [headerCreateButton] = screen.getAllByTestId('btn-final-create-agent');
    expect(headerCreateButton).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Ready Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Fully configured agent');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(
      screen.getByRole('button', {
        name: /General Purpose/i,
      })
    );

    // After Overview + Category + preset defaults, validations are satisfied
    expect(headerCreateButton).not.toBeDisabled();
  });
});
