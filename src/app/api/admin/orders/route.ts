import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { StoredOrder } from '@/types/admin';

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: { include: { variant: true } } } });
  const mapped: StoredOrder[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    name: o.customerName,
    email: o.customerEmail,
    createdAt: o.createdAt.toISOString(),
    total: Number(o.total),
    currencyCode: o.currencyCode,
    status: o.status,
    lineItems: o.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity, variantTitle: i.variant?.title ?? null })),
  }));
  return NextResponse.json(mapped);
}