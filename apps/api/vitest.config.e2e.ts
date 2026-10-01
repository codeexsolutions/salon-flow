import { defineConfig } from 'vitest/config';

// Testes e2e sobem a aplicação inteira: exigem o banco local (npm run db:up) e o .env.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['dotenv/config'],
  },
});
