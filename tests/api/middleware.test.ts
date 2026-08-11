import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

describe('admin auth gate (middleware)', () => {
  const adminPath = (cookie?: string) => {
    const headers: Record<string, string> = {};
    if (cookie !== undefined) headers['cookie'] = `sss_admin_session=${cookie}`;
    return new NextRequest('http://localhost:3000/admin', { headers });
  };

  it('redirects to /admin/login when no session cookie is present', async () => {
    const res = await middleware(adminPath());
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/admin/login');
    // must preserve where the user was going
    expect(location).toMatch(/from=%2Fadmin/);
  });

  it('does NOT redirect authenticated admins (a valid DB session token is present)', async () => {
    // The bug: middleware compares the cookie value to the literal 'authenticated'.
    // Login stores a real DB token (random hex). A present cookie must pass through
    // so AdminShell's server-side getSession() can do the authoritative check.
    const res = await middleware(adminPath('some-real-db-token-from-login'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('still redirects when the cookie is set but empty (suspicious)', async () => {
    const res = await middleware(adminPath(''));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('exempts /admin/login from the guard', async () => {
    const req = new NextRequest('http://localhost:3000/admin/login');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});
