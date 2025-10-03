import { defineWorkspace } from 'vitest/config';

const isCI = process.env.CI === 'true';
const e2eGlobs = ['**/*.e2e.spec.ts', '**/*.e2e.test.ts'];

// Use vitest workspace to run multiple projects (fixes TS typing for `projects`).
export default defineWorkspace([
  // Renderer/UI tests (jsdom)
  {
    test: {
      name: 'renderer',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['src/test/vitest.setup.ts'],
      include: [
        'src/renderer/**/__tests__/**/*.test.ts?(x)',
        'src/renderer/**/__tests__/**/*.spec.ts?(x)',
      ],
      exclude: isCI ? e2eGlobs : undefined,
      css: false,
    },
  },
  // Main (node/electron-oriented) tests
  {
    test: {
      name: 'main',
      environment: 'node',
      globals: true,
      setupFiles: ['src/main/test/vitest.setup.ts'],
      include: ['src/main/**/__tests__/**/*.test.ts?(x)', 'src/main/**/__tests__/**/*.spec.ts?(x)'],
      exclude: isCI ? e2eGlobs : undefined,
      css: false,
    },
  },
]);
