import React from 'react';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelManager } from '../ModelManager';
import type { LlmManifest } from 'llm-bridge-spec';

describe('ModelManager register dialog', () => {
  const baseProps = {
    items: [],
    isLoading: false,
    onSwitch: vi.fn(),
    onRefresh: vi.fn(),
  } satisfies Parameters<typeof ModelManager>[0];

  it('shows validation error for invalid JSON manifest', async () => {
    const user = userEvent.setup();

    render(<ModelManager {...baseProps} onRegister={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /add model/i }));
    const dialog = await screen.findByRole('dialog', { name: /register llm bridge/i });
    const textarea = within(dialog).getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'not json' } });
    await user.click(within(dialog).getByRole('button', { name: /register/i }));

    expect(await within(dialog).findByText(/unexpected token/i)).toBeInTheDocument();
    expect(baseProps.onRefresh).not.toHaveBeenCalled();
  });

  it('registers manifest and closes dialog on success', async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn(async (_manifest: LlmManifest) => {});

    render(<ModelManager {...baseProps} onRegister={onRegister} />);

    await user.click(screen.getByRole('button', { name: /add model/i }));
    const dialog = await screen.findByRole('dialog', { name: /register llm bridge/i });
    const textarea = within(dialog).getByRole('textbox');

    const manifest = {
      name: 'sample-bridge',
      language: 'node',
      description: 'Sample bridge for tests',
      schemaVersion: '1.0.0',
      entry: './index.js',
      models: [
        {
          name: 'gpt-4o',
          contextWindowTokens: 128_000,
          pricing: {
            unit: 1000,
            currency: 'USD',
            prompt: 0.002,
            completion: 0.006,
          },
        },
      ],
      capabilities: {
        modalities: ['text'],
        supportsToolCall: false,
        supportsFunctionCall: false,
        supportsMultiTurn: true,
        supportsStreaming: true,
        supportsVision: false,
      },
      configSchema: {},
    };

    fireEvent.change(textarea, { target: { value: JSON.stringify(manifest) } });
    await user.click(within(dialog).getByRole('button', { name: /register/i }));

    expect(onRegister).toHaveBeenCalledTimes(1);
    expect(onRegister).toHaveBeenCalledWith(expect.objectContaining(manifest));

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /register llm bridge/i })).not.toBeInTheDocument()
    );
  });
});
