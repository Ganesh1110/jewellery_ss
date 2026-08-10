import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartRecordToCart, gidToId } from '@/lib/db-mappers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; note?: string };
  if (!body.cartId || typeof body.note !== 'string') return NextResponse.json({ error: 'cartId and note are required' }, { status: 400 });
  const id = gidToId(body.cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });
  const updated = await prisma.cart.update({ where: { id }, data: { note: body.note }, include: { items: { include: { product: true } } } });
  return NextResponse.json(cartRecordToCart(updated, updated.items));
}