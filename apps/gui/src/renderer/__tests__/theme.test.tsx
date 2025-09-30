import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../hooks/useTheme';
import { vi } from 'vitest';

test('ThemeProvider defaults to system and updates theme', () => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    },
    writable: true,
  });

  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    writable: true,
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  const { result } = renderHook(() => useTheme(), { wrapper });

  expect(result.current.theme).toBe('system');

  act(() => {
    result.current.setTheme('dark');
  });

  expect(result.current.theme).toBe('dark');
});
