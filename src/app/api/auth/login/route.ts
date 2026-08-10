import { NextResponse } from 'next/server';
import { login, createSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { password?: string };
  if (typeof body.password !== 'string' || !body.password) {
    return NextResponse.json({ error: 'Passcode is required' }, { status: 400 });
  }
  const session = await login(body.password);
  if (!session) {
    return NextResponse.json({ error: 'Invalid Store Owner Passcode. Please try again.' }, { status: 401 });
  }
  const token = await createSession(session.email);
  const response = NextResponse.json({ ok: true, email: session.email });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}