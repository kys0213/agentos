import { vi } from 'vitest';
import renderer from 'react-test-renderer';
import { ThemeProvider } from '../contexts/ThemeContext';
import ColorModeToggle from '../components/common/ColorModeToggle';

test('toggles color mode', () => {
  const mockGetItem = vi.fn(() => null);
  const mockSetItem = vi.fn();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: mockGetItem,
      setItem: mockSetItem,
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

  const comp = renderer.create(
    <ThemeProvider>
      <ColorModeToggle />
    </ThemeProvider>
  );

  expect(comp.toJSON()).toBeTruthy();

  const buttons = comp.root.findAllByType('button');
  expect(buttons.length).toBeGreaterThan(0);
});
