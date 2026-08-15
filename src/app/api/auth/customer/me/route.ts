import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';

export async function GET() {
  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json({ customer: null }, { status: 200 });
  }
  return NextResponse.json({ customer });
}
