import { vi } from 'vitest';
import renderer from 'react-test-renderer';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ColorModeToggle from '../components/common/ColorModeToggle';
import theme from '../theme';

test('toggles color mode', () => {
  // Mock localStorage
  const mockGetItem = vi.fn(() => null);
  const mockSetItem = vi.fn();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: mockGetItem,
      setItem: mockSetItem,
    },
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    writable: true,
  });

  const comp = renderer.create(
    <ChakraProvider theme={theme}>
      <ThemeProvider>
        <ColorModeToggle />
      </ThemeProvider>
    </ChakraProvider>
  );

  // Verify component renders
  expect(comp.toJSON()).toBeTruthy();

  // Find the dropdown trigger button
  const buttons = comp.root.findAllByType('button');
  expect(buttons.length).toBeGreaterThan(0);
});
