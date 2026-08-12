import { prisma } from '@/lib/prisma';
import { productRecordToProduct, cartRecordToCart, variantRecordToVariant } from '@/lib/db-mappers';
import { seedProduct, seedVariant, seedCartWithItem, cleanupScoped, TestScope } from '../helpers/seed';

describe('db-mappers with real variants', () => {
  const scope: TestScope = {
    userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [],
  };

  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  it('maps a product with two variants (price range, stock sum, availability)', async () => {
    const productId = await seedProduct(scope, { price: 100 });
    await seedVariant(scope, productId, { sku: 'V2', price: 150, stock: 3 });
    const row = await prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
    const product = productRecordToProduct(row!);

    expect(product.variants.edges).toHaveLength(2);
    expect(product.totalInventory).toBe(13); // 10 (default) + 3
    expect(product.availableForSale).toBe(true);
    expect(product.priceRange.minVariantPrice.amount).toBe(100);
    expect(product.priceRange.maxVariantPrice.amount).toBe(150);
    expect(product.variants.edges[1].node.sku).toBe('V2');
    expect(product.variants.edges[1].node.lowStockThreshold).toBe(5);
  });

  it('excludes archived variants and drops totalInventory/availability when none sellable', async () => {
    const productId = await seedProduct(scope, { price: 100 });
    await prisma.productVariant.updateMany({ where: { productId }, data: { deletedAt: new Date(), availableForSale: false } });
    const row = await prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
    const product = productRecordToProduct(row!);
    expect(product.variants.edges).toHaveLength(0);
    expect(product.totalInventory).toBe(0);
    expect(product.availableForSale).toBe(false);
    expect(product.priceRange.minVariantPrice.amount).toBe(100); // base fallback
  });

  it('maps cart items to real variant merchandise', async () => {
    const productId = await seedProduct(scope, { price: 100 });
    await seedCartWithItem(scope, productId, 2);
    const cart = await prisma.cart.findUnique({ where: { id: scope.cartId }, include: { items: { include: { variant: { include: { product: true } } } } } });
    const mapped = cartRecordToCart(cart!, cart!.items);
    expect(mapped.lines.edges[0].node.merchandise.title).toBe('Default Title');
    expect(mapped.lines.edges[0].node.merchandise.quantityAvailable).toBe(10);
    expect(mapped.lines.edges[0].node.cost.totalAmount.amount).toBe(200);
  });
});
