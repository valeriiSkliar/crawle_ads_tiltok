import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec,vitest}.ts', 'lib/**/*.{test,spec,vitest}.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, './src'),
      '@lib': resolve(__dirname, './lib'),
      '@helpers': resolve(__dirname, './src/helpers'),
    }
  }
});