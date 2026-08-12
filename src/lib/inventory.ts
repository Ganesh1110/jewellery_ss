import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export type MovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE';

const MOVEMENT_TYPES: MovementType[] = ['SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE'];
const OUTFLOW_TYPES: MovementType[] = ['SALE', 'DAMAGE'];

export class InsufficientStockError extends Error {
  constructor(message = 'Insufficient stock') { super(message); }
}

export async function applyMovement(
  input: { variantId: number; type: MovementType; quantity: number; note?: string; reference?: string },
  txClient?: Prisma.TransactionClient
): Promise<void> {
  const tx = txClient ?? prisma;
  const { variantId, type, quantity, note = '', reference } = input;

  if (!MOVEMENT_TYPES.includes(type)) throw new Error('Invalid movement type');
  if (!Number.isInteger(quantity) || quantity === 0) throw new Error('quantity must be a non-zero integer');

  const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error('Variant not found');
  if (variant.deletedAt) throw new Error('Variant is archived');

  const signed = OUTFLOW_TYPES.includes(type)
    ? -Math.abs(quantity)
    : type === 'ADJUSTMENT'
      ? quantity
      : Math.abs(quantity);

  if (signed < 0) {
    const res = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: Math.abs(signed) } },
      data: { stock: { decrement: Math.abs(signed) } },
    });
    if (res.count === 0) throw new InsufficientStockError(`Insufficient stock for ${type}`);
  } else {
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: signed } } });
  }

  const updated = await tx.productVariant.findUnique({ where: { id: variantId } });
  if (!updated) throw new Error('Variant not found after update');
  const available = updated.stock > 0;
  await tx.productVariant.update({ where: { id: variantId }, data: { availableForSale: available } });

  await tx.inventoryMovement.create({ data: { variantId, type, quantity: signed, note, reference } });

  await tx.product.update({ where: { id: updated.productId }, data: { totalInventory: { increment: signed } } });
  const sellable = await tx.productVariant.count({
    where: { productId: updated.productId, deletedAt: null, availableForSale: true },
  });
  await tx.product.update({ where: { id: updated.productId }, data: { availableForSale: sellable > 0 } });
}
