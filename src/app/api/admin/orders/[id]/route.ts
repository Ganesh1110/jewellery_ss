import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { StoredOrder } from '@/types/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  const body = await req.json().catch(() => ({})) as { status?: string };
  if (typeof body.status !== 'string') return NextResponse.json({ error: 'status is required' }, { status: 400 });

  const order = await prisma.order.update({ where: { id }, data: { status: body.status }, include: { items: { include: { variant: true } } } }).catch(() => null);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    name: order.customerName,
    email: order.customerEmail,
    createdAt: order.createdAt.toISOString(),
    total: Number(order.total),
    currencyCode: order.currencyCode,
    status: order.status,
    lineItems: order.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity, variantTitle: i.variant?.title ?? null })),
  } as StoredOrder);
}