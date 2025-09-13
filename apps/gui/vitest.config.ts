import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/vitest.setup.ts'],
    css: false,
  },
});
