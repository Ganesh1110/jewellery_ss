import { vi } from 'vitest';
import { POST as createProduct, GET as listProducts } from '@/app/api/admin/products/route';
import { DELETE as deleteProduct } from '@/app/api/admin/products/[id]/route';
import { PATCH as patchVariantRoute } from '@/app/api/admin/variants/[id]/route';
import { PATCH as restoreRoute } from '@/app/api/admin/variants/[id]/restore/route';
import { GET as movementsGet } from '@/app/api/admin/variants/[id]/movements/route';
import { POST as movementsPost } from '@/app/api/admin/inventory/movements/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';
import { seedProduct, seedVariant, createUnexpiringSession, cleanupScoped, TestScope } from '../helpers/seed';

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

function params(id: string) {
  return { params: { id } };
}

describe('admin variant + movement APIs', () => {
  beforeAll(async () => { await createUnexpiringSession(AUTH, scope); });
  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  it('rejects unauthenticated access (401)', async () => {
    expect((await createProduct(req('/api/admin/products', 'POST', {}, undefined))).status).toBe(401);
    expect((await movementsGet(req('/api/admin/variants/1/movements', 'GET', undefined, undefined), params('1'))).status).toBe(401);
  });

  it('creates a product with a variant matrix + initial RESTOCK movements', async () => {
    const res = await createProduct(req('/api/admin/products', 'POST', {
      title: `Matrix ${Date.now()}`, price: 1000, vendor: 'Style Statement by Shakthi Atelier',
      images: ['/placeholder.svg'],
      options: [{ name: 'Size', values: ['S', 'M'] }],
      variants: [
        { title: 'S', sku: 'MAT-S', price: 1000, stock: 3, selectedOptions: [{ name: 'Size', value: 'S' }] },
        { title: 'M', sku: 'MAT-M', price: 1100, stock: 0, selectedOptions: [{ name: 'Size', value: 'M' }] },
      ],
    }, scope.sessionTokens[0]));
    expect(res.status).toBe(201);
    const product = await res.json();
    expect(product.variants.edges).toHaveLength(2);
    expect(product.totalInventory).toBe(3);

    const rows = await prisma.productVariant.findMany({ where: { productId: gidToId(product.id)! }, include: { movements: true } });
    expect(rows).toHaveLength(2);
    const s = rows.find((r) => r.sku === 'MAT-S')!;
    expect(s.movements).toHaveLength(1);
    expect(s.movements[0].type).toBe('RESTOCK');
    expect(s.movements[0].quantity).toBe(3);
    expect(rows.find((r) => r.sku === 'MAT-M')!.movements).toHaveLength(0); // no movement for 0 stock
    scope.productIds.push(gidToId(product.id)!);
  });

  it('rejects duplicate SKU among non-archived variants (409)', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const v1 = scope.variantIds.at(-1)!;
    const v2 = await seedVariant(scope, pid, { sku: 'DUP-1', price: 100, stock: 1 });
    expect(v2).toBeTruthy();
    const res = await patchVariantRoute(req(`/api/admin/variants/${v1}`, 'PATCH', { sku: 'DUP-1' }, scope.sessionTokens[0]), params(String(v1)));
    expect(res.status).toBe(409);
  });

  it('allows SKU reuse once the original is archived', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const v1 = scope.variantIds.at(-1)!;
    await prisma.productVariant.update({ where: { id: v1 }, data: { sku: 'REUSE-1' } });
    await patchVariantRoute(req(`/api/admin/variants/${v1}`, 'PATCH', { archived: true }, scope.sessionTokens[0]), params(String(v1)));
    const v2 = await prisma.productVariant.create({
      data: { productId: pid, title: 'Reuse', sku: 'REUSE-1', price: 100, selectedOptions: '[]', stock: 1 },
    });
    scope.variantIds.push(v2.id);
    expect(v2.sku).toBe('REUSE-1');
  });

  it('restores an archived variant', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const vid = scope.variantIds.at(-1)!;
    await patchVariantRoute(req(`/api/admin/variants/${vid}`, 'PATCH', { archived: true }, scope.sessionTokens[0]), params(String(vid)));
    const res = await restoreRoute(req(`/api/admin/variants/${vid}/restore`, 'PATCH', {}, scope.sessionTokens[0]), params(String(vid)));
    expect(res.status).toBe(200);
    const row = await prisma.productVariant.findUnique({ where: { id: vid } });
    expect(row!.deletedAt).toBeNull();
  });

  it('records RESTOCK/DAMAGE movements via the movements endpoint', async () => {
    const pid = await seedProduct(scope, { price: 100, stock: 4 });
    const vid = scope.variantIds.at(-1)!;
    const restock = await movementsPost(req('/api/admin/inventory/movements', 'POST', { variantId: `gid://db/ProductVariant/${vid}`, type: 'RESTOCK', quantity: 5, note: 'stock in' }, scope.sessionTokens[0]));
    expect(restock.status).toBe(200);
    const damage = await movementsPost(req('/api/admin/inventory/movements', 'POST', { variantId: `gid://db/ProductVariant/${vid}`, type: 'DAMAGE', quantity: 2, note: 'broken' }, scope.sessionTokens[0]));
    expect(damage.status).toBe(200);
    const list = await movementsGet(req(`/api/admin/variants/${vid}/movements`, 'GET', undefined, scope.sessionTokens[0]), params(String(vid)));
    const rows = await list.json();
    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe('DAMAGE');
    expect(rows[0].quantity).toBe(-2);
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: vid } });
    expect(v.stock).toBe(7); // 4 - 2 + 5
  });

  it('archives a product (soft delete) and hides it from the list', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const gid = `gid://db/Product/${pid}`;
    const del = await deleteProduct(req(`/api/admin/products/${gid}`, 'DELETE', {}, scope.sessionTokens[0]), params(String(pid)));
    expect(del.status).toBe(200);
    const row = await prisma.product.findUnique({ where: { id: pid } });
    expect(row!.deletedAt).not.toBeNull();
    const variants = await prisma.productVariant.findMany({ where: { productId: pid } });
    expect(variants.every((v) => v.deletedAt)).toBe(true);
    const list = await listProducts(req('/api/admin/products?first=100', 'GET', undefined, scope.sessionTokens[0]));
    const body = await list.json();
    const handles = body.edges.map((e: { node: { handle: string } }) => e.node.handle);
    expect(handles).not.toContain((await prisma.product.findUnique({ where: { id: pid } }))!.handle);
  });
});