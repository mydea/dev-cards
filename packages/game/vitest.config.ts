import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
    // Exclude e2e tests (playwright tests) from vitest
    include: ['src/**/*.spec.ts'],
    exclude: ['**/e2e-tests/**'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
