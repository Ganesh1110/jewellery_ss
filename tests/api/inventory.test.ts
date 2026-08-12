import { prisma } from '@/lib/prisma';
import { applyMovement, InsufficientStockError } from '@/lib/inventory';
import { seedProduct, seedVariant, cleanupScoped, TestScope } from '../helpers/seed';

describe('applyMovement (inventory ledger)', () => {
  const scope: TestScope = { userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [] };
  let variantId = 0;
  let productId = 0;

  beforeAll(async () => { productId = await seedProduct(scope, { stock: 3 }); variantId = scope.variantIds[0]; });
  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  const variant = async () => prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });

  it('restock increments stock, writes movement, updates product aggregate', async () => {
    await applyMovement({ variantId, type: 'RESTOCK', quantity: 5, note: 'Supplier batch', reference: 'PO-1' });
    expect((await variant()).stock).toBe(8);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(Number(product.totalInventory)).toBe(8);
    const m = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId, type: 'RESTOCK' }, orderBy: { createdAt: 'desc' } });
    expect(m.quantity).toBe(5);
    expect(m.note).toBe('Supplier batch');
    expect(m.reference).toBe('PO-1');
  });

  it('sale decrements and writes a negative SALE movement', async () => {
    await applyMovement({ variantId, type: 'SALE', quantity: 2, reference: '#1001' });
    expect((await variant()).stock).toBe(6);
    const m = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId, type: 'SALE' }, orderBy: { createdAt: 'desc' } });
    expect(m.quantity).toBe(-2);
    expect(m.reference).toBe('#1001');
  });

  it('guards oversell: rejects SALE beyond stock with InsufficientStockError and no movement row', async () => {
    const before = (await variant()).stock;
    const beforeCount = await prisma.inventoryMovement.count();
    await expect(applyMovement({ variantId, type: 'SALE', quantity: before + 1 })).rejects.toBeInstanceOf(InsufficientStockError);
    expect((await variant()).stock).toBe(before);
    expect(await prisma.inventoryMovement.count()).toBe(beforeCount);
  });

  it('sets availableForSale false when stock hits zero and true again on restock', async () => {
    const v = await variant();
    const qty = v.stock;
    await applyMovement({ variantId, type: 'SALE', quantity: qty });
    expect((await variant()).availableForSale).toBe(false);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.availableForSale).toBe(false);
    await applyMovement({ variantId, type: 'RESTOCK', quantity: 1 });
    expect((await variant()).availableForSale).toBe(true);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).availableForSale).toBe(true);
  });

  it('rejects movements on archived variants', async () => {
    const pid = await seedProduct(scope, { stock: 2 });
    const vid = scope.variantIds.at(-1)!;
    await prisma.productVariant.update({ where: { id: vid }, data: { deletedAt: new Date() } });
    await expect(applyMovement({ variantId: vid, type: 'RESTOCK', quantity: 1 })).rejects.toThrow(/archived/);
    await prisma.product.deleteMany({ where: { id: pid } }); // removes scope row
  });

  it('rejects zero or non-integer quantity', async () => {
    await expect(applyMovement({ variantId, type: 'RESTOCK', quantity: 0 })).rejects.toThrow(/non-zero integer/);
    await expect(applyMovement({ variantId, type: 'RESTOCK', quantity: 1.5 })).rejects.toThrow(/non-zero integer/);
  });
});
