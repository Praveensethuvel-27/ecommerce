import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
});

