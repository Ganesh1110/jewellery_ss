import { hash } from 'bcryptjs';
import { prisma } from '../../src/lib/prisma';

let counter = 0;
function nextId() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

export interface TestScope {
  userEmail: string;
  productHandle: string;
  productIds: number[];
  variantIds: number[];
  cartId: number;
  cartGid?: string;
  orderNumbers: string[];
  sessionTokens: string[];
}

export async function cleanupScoped(scope: TestScope): Promise<void> {
  // FK-safe order (children first)
  for (const orderNumber of scope.orderNumbers) {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: await prisma.order.findMany({ where: { orderNumber }, select: { id: true } }).then((rs) => rs.map((r) => r.id)) } } }).catch(() => {});
    await prisma.order.deleteMany({ where: { orderNumber } }).catch(() => {});
  }
  if (scope.cartId) {
    await prisma.cartItem.deleteMany({ where: { cartId: scope.cartId } }).catch(() => {});
    await prisma.cart.deleteMany({ where: { id: scope.cartId } }).catch(() => {});
  }
  for (const productId of scope.productIds) {
    await prisma.cartItem.deleteMany({ where: { productId } }).catch(() => {});
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
  }
  for (const token of scope.sessionTokens) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  if (scope.userEmail) {
    await prisma.user.deleteMany({ where: { email: scope.userEmail } }).catch(() => {});
  }
}

export async function seedAdminUser(email: string, password = 'admin123'): Promise<void> {
  const passwordHash = await hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, name: 'Test Owner', passwordHash },
  });
}

export async function createUnexpiringSession(email: string, scope: TestScope): Promise<string> {
  const token = `tok-test-${nextId()}`;
  await prisma.session.create({
    data: { token, email, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  scope.sessionTokens.push(token);
  return token;
}

export async function seedProduct(scope: TestScope, overrides: { price?: number; stock?: number } = {}): Promise<number> {
  const handle = `test-${nextId()}`;
  const price = overrides.price ?? 12500;
  const stock = overrides.stock ?? 10;
  const product = await prisma.product.create({
    data: {
      handle, title: `Test Product ${handle}`, description: 'A test product for the harness.',
      descriptionHtml: '<p>A test product.</p>', productType: 'Ring', price, currencyCode: 'INR',
      totalInventory: stock, availableForSale: stock > 0,
      featuredImage: JSON.stringify({ id: `gid://db/MediaImage/${handle}`, url: 'https://via.placeholder.com/400x500', altText: null, width: 1200, height: 1500 }),
      images: JSON.stringify([{ id: `gid://db/MediaImage/${handle}`, url: 'https://via.placeholder.com/400x500', altText: null, width: 400, height: 500 }]),
      options: JSON.stringify([{ id: `gid://db/ProductOption/${handle}`, name: 'Title', values: ['Default Title'] }]),
      tags: ['test'], seo: JSON.stringify({ title: 'Test', description: 'test' }), publishedAt: new Date(),
    },
  });
  scope.productIds.push(product.id);
  await seedVariant(scope, product.id, { sku: `SSS-${handle.toUpperCase().replace(/-/g, '')}`, price, stock, selectedOptions: [] });
  return product.id;
}

export async function seedVariant(scope: TestScope, productId: number, overrides: {
  sku?: string; price?: number; stock?: number; selectedOptions?: Array<{ name: string; value: string }>; lowStockThreshold?: number;
} = {}): Promise<number> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('missing product');
  const v = await prisma.productVariant.create({
    data: {
      productId, title: overrides.selectedOptions?.length ? overrides.selectedOptions.map((o) => o.value).join(' / ') : 'Default Title',
      sku: overrides.sku ?? `V-${nextId()}`, price: overrides.price ?? Number(product.price),
      currencyCode: product.currencyCode, stock: overrides.stock ?? 10,
      lowStockThreshold: overrides.lowStockThreshold ?? 5,
      selectedOptions: JSON.stringify(overrides.selectedOptions ?? []),
      availableForSale: (overrides.stock ?? 10) > 0,
    },
  });
  scope.variantIds.push(v.id);
  return v.id;
}

export async function seedCartWithItem(scope: TestScope, productId: number, quantity: number, variantId?: number): Promise<{ cartId: string; cartRowId: number }> {
  const cart = await prisma.cart.create({ data: { token: `cart-test-${nextId()}` } });
  scope.cartId = cart.id;
  scope.cartGid = `gid://db/Cart/${cart.id}`;
  const variant = variantId ?? (await prisma.productVariant.findFirstOrThrow({ where: { productId } })).id;
  await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variant, quantity } });
  return { cartId: `gid://db/Cart/${cart.id}`, cartRowId: cart.id };
}
