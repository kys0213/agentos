import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['../../vitest.setup.ts'],
    passWithNoTests: true,
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    include: ['src/**/__tests__/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
