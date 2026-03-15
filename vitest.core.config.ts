import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['core/__tests__/**/*.test.ts'],
  },
});
