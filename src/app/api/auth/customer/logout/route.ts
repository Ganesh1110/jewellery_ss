import { NextResponse } from 'next/server';
import { destroyCustomerSession, CUSTOMER_SESSION_COOKIE } from '@/lib/customer-auth';

export async function POST() {
  await destroyCustomerSession();
  const res = NextResponse.json({ success: true });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, '', { path: '/', expires: new Date(0) });
  return res;
}
