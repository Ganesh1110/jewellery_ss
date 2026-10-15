import { NextResponse } from 'next/server';
import { createCustomer, CUSTOMER_SESSION_COOKIE } from '@/lib/customer-auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limiter = await rateLimit(`cust-signup:${ip}`, { limit: 5, windowSeconds: 600 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many account creation attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '600' } }
      );
    }

    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const { customer, token } = await createCustomer(name, email, password);

    const res = NextResponse.json({ customer }, { status: 201 });
    res.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
