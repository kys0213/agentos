import { theme } from '../theme';

test('theme config sets initial mode to light', () => {
  expect(theme.config?.initialColorMode).toBe('light');
});
