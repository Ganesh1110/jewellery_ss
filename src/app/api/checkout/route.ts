import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string };
  if (!body.cartId) return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
  const id = gidToId(body.cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });

  const cart = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const lines = cart.items.filter((i) => i.quantity > 0);
  if (lines.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

  const subtotal = lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  const currency = lines[0].product.currencyCode || 'INR';

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: '',
        status: 'Processing',
        subtotal,
        total: subtotal,
        currencyCode: currency,
        paymentMethod: 'COD',
        items: {
          create: lines.map((l) => ({
            product: { connect: { id: l.productId } },
            title: l.product.title,
            handle: l.product.handle,
            price: Number(l.product.price),
            quantity: l.quantity,
            image: (l.product.featuredImage as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          })),
        },
      },
      include: { items: true },
    });
    await tx.order.update({ where: { id: created.id }, data: { orderNumber: `#${1000 + created.id}` } });

    for (const l of lines) {
      await tx.product.update({
        where: { id: l.productId },
        data: {
          totalInventory: Math.max(0, l.product.totalInventory - l.quantity),
          availableForSale: Math.max(0, l.product.totalInventory - l.quantity) > 0,
        },
      });
    }

    await tx.cart.delete({ where: { id } });
    return created;
  });

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      orderNumber: `#${1000 + order.id}`,
      name: 'Walk-in Checkout',
      email: '',
      createdAt: order.createdAt.toISOString(),
      total: Number(order.total),
      currencyCode: order.currencyCode,
      status: order.status,
      lineItems: order.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity })),
    },
  });
}