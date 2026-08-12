import { POST as loginPost } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedAdminUser, cleanupScoped, TestScope } from '../helpers/seed';

const ADMIN_EMAIL = 'admin@sss.com';
const ADMIN_PASSWORD = 'admin123';

function jsonBody(obj: unknown) {
  return {
    body: JSON.stringify(obj),
    headers: { 'Content-Type': 'application/json' },
  };
}

describe('POST /api/auth/login (DB-backed session)', () => {
  const scope: TestScope = {
    userEmail: '', // do NOT delete the real admin user; only clean up sessions
    productHandle: '',
    productIds: [],
    variantIds: [],
    cartId: 0,
    orderNumbers: [],
    sessionTokens: [],
  };

  beforeAll(async () => {
    // Idempotent: ensures the admin user exists with the known passcode.
    await seedAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  afterAll(async () => {
    await cleanupScoped(scope);
    await prisma.$disconnect();
  });

  it('creates a real DB Session row and sets an httpOnly cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      ...jsonBody({ password: ADMIN_PASSWORD }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; email: string };
    expect(body.ok).toBe(true);
    expect(body.email).toMatch(/.+@.+\..+/);

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/sss_admin_session=/);
    expect(setCookie).toMatch(/HttpOnly/);

    const match = setCookie.match(/sss_admin_session=([^;]+)/);
    expect(match).toBeTruthy();
    const token = match![1];
    scope.sessionTokens.push(token);

    const session = await prisma.session.findUnique({ where: { token } });
    expect(session).toBeTruthy();
    expect(session!.email).toBe(body.email);
    expect(session!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects an incorrect passcode with 401 and no session row', async () => {
    const before = await prisma.session.count();
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      ...jsonBody({ password: 'wrong' }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/Invalid|Store Owner/i);
    expect(res.headers.get('set-cookie')).toBeNull();
    // no new session persisted for a failed login
    expect(await prisma.session.count()).toBe(before);
  });

  it('rejects a missing passcode with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      ...jsonBody({}),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(400);
  });
});
