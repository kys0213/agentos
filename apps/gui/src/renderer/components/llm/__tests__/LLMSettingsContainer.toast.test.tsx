import React from 'react';
import { describe, it, beforeEach, afterAll, vi, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LLMSettingsContainer from '../LLMSettingsContainer';
import { withProviders } from '../../../../test/test-utils';
import * as bridgeHooks from '../../../hooks/queries/use-bridge';
import type { LLMSettingsProps } from '../LLMSettings';
import type { Mock } from 'vitest';

const toastSpy = vi.fn();
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

vi.mock('../../ui/use-toast', () => ({
  useToast: () => ({ toast: toastSpy, dismiss: vi.fn(), toasts: [] }),
}));

vi.mock('../LLMSettings', () => ({
  __esModule: true,
  default: (props: LLMSettingsProps) => {
    return (
      <div>
        <button onClick={() => props.onSwitch('bridge-b')}>Trigger Switch</button>
      </div>
    );
  },
}));

vi.mock('../../../hooks/queries/use-bridge');

const mockedUseCurrentBridge = vi.mocked(bridgeHooks.useCurrentBridge as Mock);
const mockedUseBridgeIds = vi.mocked(bridgeHooks.useBridgeIds as Mock);
const mockedUseSwitchBridge = vi.mocked(bridgeHooks.useSwitchBridge as Mock);

const renderComponent = () => render(withProviders(<LLMSettingsContainer />));

describe('LLMSettingsContainer toasts', () => {
  beforeEach(() => {
    toastSpy.mockReset();
    mockedUseCurrentBridge.mockReset();
    mockedUseBridgeIds.mockReset();
    mockedUseSwitchBridge.mockReset();

    mockedUseCurrentBridge.mockReturnValue({ data: null, isLoading: false });
    mockedUseSwitchBridge.mockReturnValue({
      mutateAsync: vi.fn(),
      isError: false,
    });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows warning toast when no bridges exist', async () => {
    mockedUseBridgeIds.mockReturnValue({ data: [], isLoading: false });

    renderComponent();

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No LLM bridges found',
        })
      )
    );
  });

  it('shows success toast when switch succeeds', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockedUseBridgeIds.mockReturnValue({ data: ['bridge-a', 'bridge-b'], isLoading: false });
    mockedUseCurrentBridge.mockReturnValue({
      data: { id: 'bridge-a' },
      isLoading: false,
    });
    mockedUseSwitchBridge.mockReturnValue({ mutateAsync, isError: false });

    renderComponent();

    const triggerButton = screen.getByRole('button', { name: /Trigger Switch/i });
    await userEvent.click(triggerButton);

    expect(mutateAsync).toHaveBeenCalledWith('bridge-b');
    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'bridge-b is now active.',
        })
      )
    );
  });

  it('shows error toast when switch fails', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('failure'));
    mockedUseBridgeIds.mockReturnValue({ data: ['bridge-a', 'bridge-b'], isLoading: false });
    mockedUseCurrentBridge.mockReturnValue({
      data: { id: 'bridge-a' },
      isLoading: false,
    });
    mockedUseSwitchBridge.mockReturnValue({ mutateAsync, isError: true });

    renderComponent();

    const triggerButton = screen.getByRole('button', { name: /Trigger Switch/i });
    await userEvent.click(triggerButton);

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to switch bridge',
          description: 'failure',
        })
      )
    );
  });
});
