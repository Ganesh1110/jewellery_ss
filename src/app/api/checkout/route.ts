import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';
import { applyMovement, InsufficientStockError } from '@/lib/inventory';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    cartId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    address?: { addressLine?: string; city?: string; state?: string; pincode?: string };
    createAccount?: boolean;
    password?: string;
  };
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

  const name = body.customerName?.trim() || 'Guest Customer';
  const email = body.customerEmail?.trim() || '';
  const phone = body.customerPhone?.trim() || '';
  const addressJson = body.address || null;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const subtotal = lines.reduce((sum, l) => sum + Number(l.variant.price) * l.quantity, 0);
      const currency = lines[0].variant.currencyCode || 'INR';

      const created = await tx.order.create({
        data: {
          orderNumber: '',
          status: 'Processing',
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          address: addressJson ? (addressJson as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          subtotal,
          total: subtotal,
          currencyCode: currency,
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
        include: { items: { include: { variant: true } } },
      });

      const orderNumber = `#${1000 + created.id}`;
      await tx.order.update({ where: { id: created.id }, data: { orderNumber } });

      for (const l of lines) {
        await applyMovement({ variantId: l.variant.id, type: 'SALE', quantity: l.quantity, reference: orderNumber }, tx);
      }

      // If guest user opted to create account during checkout
      if (body.createAccount && email) {
        const existingCustomer = await tx.customer.findUnique({ where: { email } });
        if (!existingCustomer) {
          const bcrypt = await import('bcryptjs');
          const defaultPassword = body.password && body.password.length >= 6 ? body.password : 'JewelryPass@123';
          const passwordHash = await bcrypt.hash(defaultPassword, 10);
          await tx.customer.create({
            data: {
              email,
              name,
              passwordHash,
            },
          });
        }
      }

      await tx.cart.delete({ where: { id } });
      return created;
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: `#${1000 + order.id}`,
        name: order.customerName,
        email: order.customerEmail,
        createdAt: order.createdAt.toISOString(),
        total: Number(order.total),
        currencyCode: order.currencyCode,
        status: order.status,
        lineItems: order.items.map((i) => ({
          title: i.title,
          image: (i.image as { url?: string } | null)?.url || '/placeholder.svg',
          quantity: i.quantity,
          variantTitle: i.variant?.title ?? null,
        })),
      },
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}