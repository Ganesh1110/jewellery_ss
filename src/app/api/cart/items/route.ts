import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartRecordToCart, gidToId } from '@/lib/db-mappers';

async function getCart(cartId: string) {
  const id = gidToId(cartId);
  if (id == null) return null;
  const cart = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { variant: { include: { product: true } } } } } });
  return cart ? { cart, id } : null;
}

function cartJson(cart: NonNullable<Awaited<ReturnType<typeof getCart>>>['cart']) {
  return NextResponse.json(cartRecordToCart(cart, cart.items));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; lines?: Array<{ merchandiseId: string; quantity: number }> };
  if (!body.cartId || !Array.isArray(body.lines)) return NextResponse.json({ error: 'cartId and lines are required' }, { status: 400 });
  const found = await getCart(body.cartId);
  if (!found) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const { id } = found;

  for (const line of body.lines) {
    const productId = gidToId(line.merchandiseId);
    if (productId == null) continue;
    const variant = await prisma.productVariant.findFirst({ where: { productId } });
    if (!variant) continue;
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: id, variantId: variant.id } },
      update: { quantity: { increment: Math.max(1, line.quantity) } },
      create: { cartId: id, productId, variantId: variant.id, quantity: Math.max(1, line.quantity) },
    });
  }
  const updated = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { variant: { include: { product: true } } } } } });
  return cartJson(updated!);
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; lines?: Array<{ id: string; quantity: number }> };
  if (!body.cartId || !Array.isArray(body.lines)) return NextResponse.json({ error: 'cartId and lines are required' }, { status: 400 });
  const found = await getCart(body.cartId);
  if (!found) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const { id } = found;

  for (const line of body.lines) {
    const itemId = gidToId(line.id);
    if (itemId == null) continue;
    if (line.quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => {});
    } else {
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: line.quantity } }).catch(() => {});
    }
  }
  const updated = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { variant: { include: { product: true } } } } } });
  return cartJson(updated!);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; lineIds?: string[] };
  if (!body.cartId || !Array.isArray(body.lineIds)) return NextResponse.json({ error: 'cartId and lineIds are required' }, { status: 400 });
  const found = await getCart(body.cartId);
  if (!found) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const { id } = found;

  for (const lineId of body.lineIds) {
    const itemId = gidToId(lineId);
    if (itemId == null) continue;
    await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => {});
  }
  const updated = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { variant: { include: { product: true } } } } } });
  return cartJson(updated!);
}