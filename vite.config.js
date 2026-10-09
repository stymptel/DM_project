import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 10000,
  },
});
