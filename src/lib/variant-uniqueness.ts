import type { Prisma, PrismaClient } from '@prisma/client';

// Structural client: works with both `prisma` (PrismaClient) and a
// `$transaction` client (TransactionClient).
type ClientLike = Pick<Prisma.TransactionClient, 'productVariant'>;

export class SkuConflictError extends Error {}
export class BarcodeConflictError extends Error {}

export async function assertSkuUnique(sku: string, excludeVariantId: number | null, tx: ClientLike): Promise<void> {
  const existing = await tx.productVariant.findFirst({
    where: { sku, deletedAt: null, ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}) },
  });
  if (existing) throw new SkuConflictError(`SKU already in use: ${sku}`);
}

export async function assertBarcodeUnique(barcode: string, excludeVariantId: number | null, tx: ClientLike): Promise<void> {
  const existing = await tx.productVariant.findFirst({
    where: { barcode, deletedAt: null, ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}) },
  });
  if (existing) throw new BarcodeConflictError(`Barcode already in use: ${barcode}`);
}