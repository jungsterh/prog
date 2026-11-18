import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolve workspace packages to their TypeScript source in tests.
    conditions: ['@ai-workspace/source'],
  },
  ssr: {
    resolve: {
      conditions: ['@ai-workspace/source'],
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15_000,
  },
});
