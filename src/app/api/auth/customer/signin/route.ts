import { NextResponse } from 'next/server';
import { loginCustomer, CUSTOMER_SESSION_COOKIE } from '@/lib/customer-auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limiter = await rateLimit(`cust-signin:${ip}`, { limit: 10, windowSeconds: 60 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await loginCustomer(email, password);
    if (!result) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({ customer: result.customer }, { status: 200 });
    res.cookies.set(CUSTOMER_SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sign in failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
