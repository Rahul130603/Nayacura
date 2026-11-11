import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    testTimeout: 45_000,
    hookTimeout: 45_000,
    setupFiles: ['./tests/setup-env.ts'],
  },
});
