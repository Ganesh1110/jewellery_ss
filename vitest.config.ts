import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Vitest runs in a subprocess that does NOT load Next.js env files, so we point
// the Prisma client at the local dev MySQL database (already seeded) here.
// Tests only ever touch data scoped to test-<uuid> / @test.* identifiers and
// clean it up in afterAll, so the shared dev DB is never mutated for real rows.
const DEV_URL = 'mysql://sss:sss12345@localhost:3306/sss_ecommerce';

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
