import 'reflect-metadata';
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
  // Timer shims
  useFakeTimers: vi.useFakeTimers.bind(vi),
  useRealTimers: vi.useRealTimers.bind(vi),
  advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  setSystemTime: vi.setSystemTime.bind(vi),
  runAllTimers: vi.runAllTimers?.bind(vi),
  // Per-suite timeout (best-effort no-op; tests are fast)
  setTimeout: (_ms: number) => undefined,
};

afterEach(() => {
  vi.clearAllMocks();
});
