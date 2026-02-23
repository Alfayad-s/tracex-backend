import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/integration/**/*.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text'], exclude: ['**/*.test.ts', '**/dist/**'] },
  },
});
