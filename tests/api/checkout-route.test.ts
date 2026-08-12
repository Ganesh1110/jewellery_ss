import { POST as checkoutPost } from '@/app/api/checkout/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedProduct, seedCartWithItem, cleanupScoped, TestScope } from '../helpers/seed';

function makeBody(cartId: string) {
  return new NextRequest('http://localhost:3000/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ cartId }),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/checkout (DB-backed order creation)', () => {
  const scope: TestScope = {
    userEmail: '',
    productHandle: '',
    productIds: [],
    variantIds: [],
    cartId: 0,
    orderNumbers: [],
    sessionTokens: [],
  };

  beforeAll(async () => {
    const productId = await seedProduct(scope, { stock: 10 });
    await seedCartWithItem(scope, productId, 2);
  });

  afterAll(async () => {
    await cleanupScoped(scope);
    await prisma.$disconnect();
  });

  it('writes an Order, decrements inventory, and deletes the cart', async () => {
    const cartId = scope.cartGid!;
    const res = await checkoutPost(makeBody(cartId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.order.orderNumber).toMatch(/^#\d+$/);
    expect(body.order.status).toBe('Processing');
    scope.orderNumbers.push(body.order.orderNumber);

    const order = await prisma.order.findUnique({
      where: { orderNumber: body.order.orderNumber },
      include: { items: true },
    });
    expect(order).toBeTruthy();
    expect(order!.items.length).toBe(1);
    expect(order!.items[0].quantity).toBe(2);
    expect(Number(order!.total)).toBe(25000);
    expect(order!.status).toBe('Processing');

    const product = await prisma.product.findUnique({ where: { id: scope.productIds[0] } });
    expect(product!.totalInventory).toBe(8);
    expect(product!.availableForSale).toBe(true);

    const cartIdNum = Number(cartId.split('/').pop());
    const cart = await prisma.cart.findUnique({ where: { id: cartIdNum } });
    expect(cart).toBeNull();
  });

  it('returns 400 for a missing cartId', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await checkoutPost(req);
    expect(res.status).toBe(400);
  });
});
