import 'reflect-metadata';
import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Global cleanup for mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});
