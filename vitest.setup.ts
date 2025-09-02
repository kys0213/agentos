import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Minimal Jest compatibility shim for smoother migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
};

afterEach(() => {
  vi.clearAllMocks();
});

