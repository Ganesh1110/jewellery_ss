import { POST as createCart } from '@/app/api/cart/route';
import { POST as addItems, PATCH as updateItems, DELETE as removeItems } from '@/app/api/cart/items/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';
import { seedProduct, seedVariant, cleanupScoped, TestScope } from '../helpers/seed';

function makeReq(path: string, body: unknown) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}

describe('variant-keyed cart', () => {
  const scope: TestScope = { userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [] };
  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  it('creates a cart with variant lines and merges duplicate variants', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const v1 = scope.variantIds[0];
    const v2 = await seedVariant(scope, pid, { sku: 'V2', price: 150, selectedOptions: [{ name: 'Colour', value: 'Rose' }] });

    const res = await createCart(makeReq('/api/cart', { lines: [
      { merchandiseId: `gid://db/ProductVariant/${v1}`, quantity: 2 },
      { merchandiseId: `gid://db/ProductVariant/${v2}`, quantity: 1 },
    ] }));
    expect(res.status).toBe(200);
    const cart = await res.json();
    const cartId = cart.id;

    const added = await addItems(makeReq('/api/cart/items', { cartId, lines: [{ merchandiseId: `gid://db/ProductVariant/${v1}`, quantity: 3 }] }));
    const body = await added.json();
    expect(body.lines.edges).toHaveLength(2);
    const handle = (await prisma.product.findUnique({ where: { id: pid } }))!.handle.toUpperCase().replace(/-/g, '');
    const merged = body.lines.edges.find((e: { node: { merchandise: { sku: string } } }) => e.node.merchandise.sku === `SSS-${handle}`);
    expect(merged.node.quantity).toBe(5);
    expect(body.lines.edges.find((e: { node: { merchandise: { sku: string } } }) => e.node.merchandise.sku === 'V2').node.merchandise.selectedOptions[0].value).toBe('Rose');
  });

  it('updates and removes variant lines', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const v1 = scope.variantIds[0];
    const res = await createCart(makeReq('/api/cart', { lines: [{ merchandiseId: `gid://db/ProductVariant/${v1}`, quantity: 2 }] }));
    const cartId = (await res.json()).id;
    const cartIdNum = gidToId(cartId)!;

    const patched = await updateItems(makeReq('/api/cart/items', {
      cartId,
      lines: [{ id: `gid://db/CartLine/${(await prisma.cartItem.findFirstOrThrow({ where: { cartId: cartIdNum } })).id}`, quantity: 4 }],
    }));
    expect((await patched.json()).lines.edges[0].node.quantity).toBe(4);

    const removed = await removeItems(makeReq('/api/cart/items', {
      cartId,
      lineIds: [`gid://db/CartLine/${(await prisma.cartItem.findFirstOrThrow({ where: { cartId: cartIdNum } })).id}`],
    }));
    expect((await removed.json()).lines.edges).toHaveLength(0);
  });
});