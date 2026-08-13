import { vi } from 'vitest';
import { GET as listOrders } from '@/app/api/admin/orders/route';
import { POST as checkout } from '@/app/api/checkout/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedProduct, seedVariant, createUnexpiringSession, cleanupScoped, seedCartWithItem, TestScope } from '../helpers/seed';

const SESSION_COOKIE = 'sss_admin_session';
const cookieStore: { value?: string } = {};

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => (name === SESSION_COOKIE && cookieStore.value ? { name, value: cookieStore.value } : undefined),
  }),
}));

const AUTH = 'admin@sss.com';
const scope: TestScope = { userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [] };

function req(path: string, method: string, body: unknown, cookie?: string) {
  cookieStore.value = cookie;
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    body: method === 'GET' ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: `sss_admin_session=${cookie}` } : {}) },
  });
}

describe('admin orders mapping', () => {
  beforeAll(async () => { await createUnexpiringSession(AUTH, scope); });
  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  it('maps the purchased variant title onto the order line item', async () => {
    const pid = await seedProduct(scope, { price: 500 });
    const vid = await seedVariant(scope, pid, { sku: 'ORDER-VAR-1', price: 500, stock: 5, selectedOptions: [{ name: 'Size', value: 'Large' }] });
    const { cartId } = await seedCartWithItem(scope, pid, 2, vid);

    const checkoutRes = await checkout(req('/api/checkout', 'POST', { cartId }));
    expect(checkoutRes.status).toBe(200);
    const orderBody = await checkoutRes.json();
    expect(orderBody.order.lineItems[0].variantTitle).toBe('Large');

    cookieStore.value = scope.sessionTokens[0];
    const listRes = await listOrders();
    expect(listRes.status).toBe(200);
    const orders = await listRes.json();
    const order = orders.find((o: { orderNumber: string }) => o.orderNumber === orderBody.order.orderNumber);
    expect(order).toBeTruthy();
    expect(order.lineItems).toHaveLength(1);
    expect(order.lineItems[0].variantTitle).toBe('Large');
    expect(order.lineItems[0].title).toBe('Large');
    scope.orderNumbers.push(orderBody.order.orderNumber);
  });
});
