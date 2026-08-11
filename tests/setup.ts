// Vitest does not load Next.js env files; wire the Prisma client at the local
// dev MySQL DB. Tests seed only test-scoped rows and delete them in afterAll.
import { DEV_URL } from '../vitest.config';

process.env.DATABASE_URL = DEV_URL;
