import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';
import { applyMovement, InsufficientStockError } from '@/lib/inventory';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string };
  if (!body.cartId) return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
  const id = gidToId(body.cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { id },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const lines = cart.items.filter((i) => i.quantity > 0);
  if (lines.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const subtotal = lines.reduce((sum, l) => sum + Number(l.variant.price) * l.quantity, 0);
      const currency = lines[0].variant.currencyCode || 'INR';

      const created = await tx.order.create({
        data: {
          orderNumber: '', status: 'Processing', subtotal, total: subtotal, currencyCode: currency,
          paymentMethod: 'COD',
          items: {
            create: lines.map((l) => ({
              product: { connect: { id: l.variant.productId } },
              variant: { connect: { id: l.variant.id } },
              title: l.variant.title,
              handle: l.variant.product.handle,
              price: Number(l.variant.price),
              quantity: l.quantity,
              image: (l.variant.image as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            })),
          },
        },
        include: { items: true },
      });

      const orderNumber = `#${1000 + created.id}`;
      await tx.order.update({ where: { id: created.id }, data: { orderNumber } });

      for (const l of lines) {
        await applyMovement({ variantId: l.variant.id, type: 'SALE', quantity: l.quantity, reference: orderNumber }, tx);
      }

      await tx.cart.delete({ where: { id } });
      return created;
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id, orderNumber: `#${1000 + order.id}`, name: 'Walk-in Checkout', email: '',
        createdAt: order.createdAt.toISOString(), total: Number(order.total), currencyCode: order.currencyCode,
        status: order.status,
        lineItems: order.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity })),
      },
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}