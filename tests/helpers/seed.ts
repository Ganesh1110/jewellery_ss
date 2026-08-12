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

export async function seedProduct(scope: TestScope, overrides: {
  price?: number;
  totalInventory?: number;
} = {}): Promise<number> {
  const handle = `test-${nextId()}`;
  const price = overrides.price ?? 12500;
  const totalInventory = overrides.totalInventory ?? 10;
  const product = await prisma.product.create({
    data: {
      handle,
      title: `Test Product ${handle}`,
      description: 'A test product for the harness.',
      descriptionHtml: '<p>A test product.</p>',
      productType: 'Ring',
      price,
      currencyCode: 'INR',
      totalInventory,
      featuredImage: JSON.stringify({ id: `gid://db/MediaImage/${handle}`, url: 'https://via.placeholder.com/400x500', altText: null, width: 1200, height: 1500 }),
      images: JSON.stringify([{ id: `gid://db/MediaImage/${handle}`, url: 'https://via.placeholder.com/400x500', altText: null, width: 400, height: 500 }]),
      options: JSON.stringify([{ id: `gid://db/ProductOption/${handle}`, name: 'Material', values: ['18k Gold'] }]),
      tags: ['test'],
      seo: JSON.stringify({ title: 'Test', description: 'test' }),
      publishedAt: new Date(),
    },
  });
  await prisma.productVariant.create({
    data: {
      productId: product.id,
      title: 'Default Title',
      sku: `SSS-${handle.toUpperCase().replace(/-/g, '')}-DEFAULT`,
      price,
      currencyCode: 'INR',
      stock: totalInventory,
      selectedOptions: JSON.stringify([]),
      availableForSale: totalInventory > 0,
    },
  });
  scope.productIds.push(product.id);
  return product.id;
}

export async function seedCartWithItem(scope: TestScope, productId: number, quantity: number): Promise<{ cartId: string; cartRowId: number }> {
  const cart = await prisma.cart.create({ data: { token: `cart-test-${nextId()}` } });
  scope.cartId = cart.id;
  scope.cartGid = `gid://db/Cart/${cart.id}`;
  const variant = await prisma.productVariant.findFirst({ where: { productId } });
  if (!variant) throw new Error(`seedCartWithItem: no variant found for product ${productId}`);
  await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variant.id, quantity } });
  return { cartId: `gid://db/Cart/${cart.id}`, cartRowId: cart.id };
}
