import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MCPToolCreate } from '../MCPToolCreate';
import { withProviders } from '../../../../test/test-utils';

const renderComponent = () =>
  render(withProviders(<MCPToolCreate onBack={() => undefined} onCreate={() => undefined} />));

describe('MCPToolCreate validation toasts', () => {
  it('shows toast when overview fields are missing', async () => {
    renderComponent();

    const nextButton = screen.getByRole('button', { name: /Next: Choose Connection Type/i });
    await userEvent.click(nextButton);

    const messages = await screen.findAllByText('Tool name is required before continuing.');
    expect(messages.length).toBeGreaterThanOrEqual(1);

    const nameInput = screen.getByLabelText(/Tool Name/i);
    await userEvent.type(nameInput, 'test-mcp');
    await userEvent.click(nextButton);
  });

  it('shows toast when connection command/url is missing', async () => {
    renderComponent();

    // Fill overview
    await userEvent.type(screen.getByLabelText(/Tool Name/i), 'stdio-tool');
    await userEvent.click(screen.getByRole('button', { name: /Next: Choose Connection Type/i }));
    await userEvent.click(screen.getByRole('button', { name: /Next: Configuration/i }));

    const configNextButton = screen.getByRole('button', { name: /Next: Testing/i });
    await userEvent.click(configNextButton);

    const commandMessages = await screen.findAllByText(
      'Command path is required before continuing.'
    );
    expect(commandMessages.length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByLabelText(/Command \*/i), 'node server.js');
    await userEvent.click(configNextButton);
  });
});
