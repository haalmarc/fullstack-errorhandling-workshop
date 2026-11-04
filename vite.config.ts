import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: { '@workshop': fileURLToPath(new URL(`./${mode === 'losningsforslag' ? 'losningsforslag' : 'start'}/frontend`, import.meta.url)) },
  },
  server: {
    host: 'localhost', port: 5173, strictPort: true,
    proxy: { '/api': { target: 'http://localhost:5050' } },
  },
  build: { outDir: `dist/${mode === 'losningsforslag' ? 'losningsforslag' : 'start'}` },
  test: { include: ['tests/**/*.test.ts'] },
}));
