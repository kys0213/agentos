import { defineConfig } from 'vitest/config';

export default defineConfig({
  projects: [
    // Renderer/UI tests (jsdom)
    defineConfig({
      test: {
        name: 'renderer',
        environment: 'jsdom',
        setupFiles: ['src/test/vitest.setup.ts'],
        include: [
          'src/renderer/**/__tests__/**/*.test.ts?(x)',
          'src/renderer/**/__tests__/**/*.spec.ts?(x)'
        ],
        css: false,
      },
    }),
    // Main (node/electron-oriented) tests
    defineConfig({
      test: {
        name: 'main',
        environment: 'node',
        include: [
          'src/main/**/__tests__/**/*.test.ts?(x)',
          'src/main/**/__tests__/**/*.spec.ts?(x)'
        ],
        css: false,
      },
    }),
  ],
});
