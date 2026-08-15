import { NextResponse } from 'next/server';
import { createCustomer, CUSTOMER_SESSION_COOKIE } from '@/lib/customer-auth';

export async function POST(req: Request) {
  try {
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
