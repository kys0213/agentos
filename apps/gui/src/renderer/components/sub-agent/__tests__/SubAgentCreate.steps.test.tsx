import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { withProviders } from '../../../../test/test-utils';
import { SubAgentCreate } from '../SubAgentCreate';
import type { BridgeModelSettingsProps } from '../../preset/BridgeModelSettings';

const bridgePropsRef: { current?: BridgeModelSettingsProps } = {};

vi.mock('../../preset/BridgeModelSettings', () => ({
  default: (props: BridgeModelSettingsProps) => {
    bridgePropsRef.current = props;
    return <div data-testid="mock-bridge-settings" />;
  },
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

  const setup = (overrides: Partial<React.ComponentProps<typeof SubAgentCreate>> = {}) => {
    bridgePropsRef.current = undefined;
    return render(
      withProviders(
        <SubAgentCreate
          onBack={noop}
          onCreate={overrides.onCreate ?? noop}
          presetTemplate={basePreset}
        />
      )
    );
  };

  it('should navigate between tabs when user clicks step headers', async () => {
    setup();

    await userEvent.click(screen.getByRole('tab', { name: 'AI Config' }));
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('should alert overview validation when required fields are missing', async () => {
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

  it('should submit agent when required fields are provided', async () => {
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

  it('should normalize bridge id when submitting agent with whitespace in bridge config', async () => {
    const onCreate = vi.fn();
    setup({ onCreate });

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Bridge Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Uses trimmed bridge ID');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    expect(bridgePropsRef.current).toBeDefined();
    bridgePropsRef.current?.onChange?.({
      llmBridgeConfig: { bridgeId: '  ollama-llm-bridge  ', model: 'llama3' },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));
    await userEvent.click(screen.getByTestId('btn-submit-agent'));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const payload = onCreate.mock.calls[0][0] as CreateAgentMetadata;
    expect(payload.preset.llmBridgeName).toBe('ollama-llm-bridge');
    expect(payload.preset.llmBridgeConfig?.bridgeId).toBe('ollama-llm-bridge');
  });

  it('should allow creation when only an ollama bridge is configured', async () => {
    const onCreate = vi.fn();
    const ollamaPreset: ReadonlyPreset = {
      ...basePreset,
      llmBridgeName: '',
      llmBridgeConfig: {},
    };
    setup({ onCreate, presetTemplate: ollamaPreset });

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Ollama Only Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Uses only the ollama bridge');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    expect(bridgePropsRef.current).toBeDefined();
    bridgePropsRef.current?.onChange?.({
      llmBridgeConfig: { bridgeId: 'ollama-llm-bridge', model: 'llama3' },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));
    expect(screen.queryByText('Select an LLM bridge before continuing.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('btn-submit-agent'));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const payload = onCreate.mock.calls[0][0] as CreateAgentMetadata;
    expect(payload.preset.llmBridgeConfig?.bridgeId).toBe('ollama-llm-bridge');
    expect(payload.preset.llmBridgeName).toBe('ollama-llm-bridge');
  });

  it('should log validation failure when trimmed bridge id is empty', async () => {
    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => undefined);
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);

    setup();

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Invalid Bridge Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Bridge id will be blank');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    bridgePropsRef.current?.onChange?.({ llmBridgeConfig: { bridgeId: '   ' } });

    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));

    expect(screen.getByText('Select an LLM bridge before continuing.')).toBeInTheDocument();
    const hasValidationLog = groupSpy.mock.calls.some(
      ([label]) => label === '[subagent-bridge] validation-fail'
    );
    expect(hasValidationLog).toBe(true);

    groupSpy.mockRestore();
    groupEndSpy.mockRestore();
  });

  it('should ignore null bridge id updates without breaking validation', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Null Bridge Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Null bridge id test');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    expect(() =>
      bridgePropsRef.current?.onChange?.({ llmBridgeConfig: { bridgeId: null } })
    ).not.toThrow();

    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));
    expect(screen.queryByText('Select an LLM bridge before continuing.')).not.toBeInTheDocument();
  });

  it('should keep previous bridge id when bridge config omits bridgeId', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Undefined Bridge Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Undefined bridge id test');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    bridgePropsRef.current?.onChange?.({ llmBridgeConfig: { model: 'gpt-4' } });

    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));
    expect(screen.queryByText('Select an LLM bridge before continuing.')).not.toBeInTheDocument();
  });

  it('should normalize bridge name when llmBridgeName contains whitespace', async () => {
    const onCreate = vi.fn();
    setup({ onCreate });

    await userEvent.type(screen.getByLabelText(/Agent Name/i), 'Bridge Name Agent');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Bridge name trim test');

    await userEvent.click(screen.getByRole('button', { name: 'Next: Category' }));
    await userEvent.click(screen.getByRole('button', { name: /General Purpose/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: AI Config' }));

    bridgePropsRef.current?.onChange?.({ llmBridgeName: '  ollama-llm-bridge  ' });

    await userEvent.click(screen.getByRole('button', { name: 'Next: Agent Settings' }));
    await userEvent.click(screen.getByTestId('btn-submit-agent'));

    const payload = onCreate.mock.calls[0][0] as CreateAgentMetadata;
    expect(payload.preset.llmBridgeName).toBe('ollama-llm-bridge');
  });

  it('should notify parent when step changes in controlled mode', async () => {
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
