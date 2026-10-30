/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 8080 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      // A meta de cobertura vale para as camadas com regra: domain e application.
      include: ['src/**/domain/**/*.{ts,tsx}', 'src/**/application/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/ports.ts'],
      reporter: ['text-summary', 'text', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
