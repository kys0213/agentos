import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['../../vitest.setup.ts'],
    passWithNoTests: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    environmentMatchGlobs: [
      ['src/renderer/**', 'jsdom'],
      ['src/main/**', 'node'],
    ],
    include: ['src/**/__tests__/**/*.{test,spec}.ts', 'src/**/__tests__/**/*.{test,spec}.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    deps: {
      optimizer: {
        ssr: {
          include: ['llm-bridge-spec'],
        },
      },
    },
  },
  // No alias needed; core ESM uses relative imports
  ssr: {
    noExternal: ['llm-bridge-spec'],
  },
});
