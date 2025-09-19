import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { withProviders } from '../../../../test/test-utils';
import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { SubAgentCreate } from '../SubAgentCreate';

vi.mock('../../../hooks/queries/use-mcp', () => ({
  useMcpTools: () => ({ data: { items: [] }, isLoading: false }),
}));

describe('SubAgentCreate Import JSON', () => {
  const noop = () => {};
  const onCreate: (agent: CreateAgentMetadata) => void = () => {};
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

  const bootstrapWizard = async () => {
    render(
      withProviders(
        <SubAgentCreate onBack={noop} onCreate={onCreate} presetTemplate={basePreset} />
      )
    );

    await userEvent.clear(await screen.findByLabelText(/Agent Name/i));
    await userEvent.type(await screen.findByLabelText(/Agent Name/i), 'Agent X');
    await userEvent.type(await screen.findByLabelText(/Description/i), 'Description');

    await userEvent.click(await screen.findByRole('button', { name: 'Next: Category' }));
    await userEvent.click(
      await screen.findByRole('button', {
        name: /General Purpose/i,
      })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Next: AI Config' }));
  };

  it('blocks advancing when required fields are missing', async () => {
    render(
      withProviders(
        <SubAgentCreate onBack={noop} onCreate={onCreate} presetTemplate={basePreset} />
      )
    );

    // Attempt to move forward without filling name/description
    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    expect(await screen.findByText(/Agent name is required/i)).toBeInTheDocument();

    await userEvent.type(await screen.findByLabelText(/Agent Name/i), 'Wizard');
    await userEvent.type(await screen.findByLabelText(/Description/i), 'Desc');
    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    // Clear system prompt and try to proceed
    const promptArea = await screen.findByPlaceholderText(/guides your agent's behavior/i);
    await userEvent.clear(promptArea);
    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));
    expect(await screen.findByText(/System prompt cannot be empty/i)).toBeInTheDocument();
  });

  it('shows error for invalid JSON', async () => {
    await bootstrapWizard();
    await userEvent.click(await screen.findByRole('button', { name: 'Next: Agent Settings' }));
    await userEvent.click(await screen.findByRole('tab', { name: /settings/i }));

    const textarea = await screen.findByPlaceholderText(/Paste exported agent JSON here/i);
    await userEvent.clear(textarea);
    fireEvent.change(textarea, { target: { value: 'not a json' } });

    await userEvent.click(screen.getByRole('button', { name: /apply/i }));

    // Error message should appear
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it('applies valid JSON and updates system prompt', async () => {
    await bootstrapWizard();
    await userEvent.click(await screen.findByRole('button', { name: 'Next: Agent Settings' }));
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
