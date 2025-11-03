import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['../../vitest.setup.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    deps: {
      moduleDirectories: ['node_modules', '../../node_modules'],
      optimizer: {
        ssr: {
          include: ['@nestjs/common', '@nestjs/core', '@nestjs/platform-express', '@mikro-orm/core', '@mikro-orm/nestjs', '@mikro-orm/sqlite', 'rxjs'],
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
