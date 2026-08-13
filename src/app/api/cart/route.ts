import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartRecordToCart, gidToId } from '@/lib/db-mappers';
import type { Cart } from '@/types/shopify';

async function resolveVariant(merchandiseId: string) {
  const id = gidToId(merchandiseId);
  if (id == null) return null;
  return prisma.productVariant.findUnique({ where: { id }, include: { product: true } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { lines?: Array<{ merchandiseId: string; quantity: number }> };
  const cart = await prisma.cart.create({ data: { token: crypto.randomUUID() } });
  if (Array.isArray(body.lines)) {
    for (const line of body.lines) {
      const variant = await resolveVariant(line.merchandiseId);
      if (!variant || variant.deletedAt || !variant.availableForSale) continue;
      await prisma.cartItem.create({ data: { cartId: cart.id, productId: variant.productId, variantId: variant.id, quantity: Math.max(1, line.quantity) } });
    }
  }
  const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { variant: { include: { product: true } } } } } });
  return NextResponse.json(cartRecordToCart(full!, full!.items));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cartId = searchParams.get('cartId');
  if (!cartId) return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
  const id = gidToId(cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });
  const cart = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { variant: { include: { product: true } } } } } });
  if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  return NextResponse.json(cartRecordToCart(cart, cart.items));
}