import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Vitest runs in a subprocess that does NOT load Next.js env files, so we point
// the Prisma client at TEST_DATABASE_URL or the PostgreSQL database.
// Tests only ever touch data scoped to test-<uuid> / @test.* identifiers and
// clean it up in afterAll, so the shared dev DB is never mutated for real rows.
const DEV_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/sss_ecommerce?schema=public';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});

export { DEV_URL };
