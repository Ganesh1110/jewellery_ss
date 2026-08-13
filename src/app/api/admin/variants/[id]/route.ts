import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId, variantRecordToVariant } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import { assertBarcodeUnique, assertSkuUnique, SkuConflictError, BarcodeConflictError } from '@/lib/variant-uniqueness';
import type { VariantUpdate } from '@/types/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  const body = await req.json().catch(() => ({})) as VariantUpdate;

  try {
    if (body.sku !== undefined) await assertSkuUnique(body.sku || '', id, prisma);
    if (body.barcode !== undefined) await assertBarcodeUnique(body.barcode || '', id, prisma);
  } catch (e) {
    if (e instanceof SkuConflictError || e instanceof BarcodeConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }

  const updated = await prisma.productVariant.update({
    where: { id },
    data: {
      ...(body.sku !== undefined ? { sku: body.sku || null } : {}),
      ...(body.barcode !== undefined ? { barcode: body.barcode || null } : {}),
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.compareAtPrice !== undefined ? { compareAtPrice: body.compareAtPrice } : {}),
      ...(body.lowStockThreshold !== undefined ? { lowStockThreshold: body.lowStockThreshold } : {}),
      ...(body.archived !== undefined ? { deletedAt: body.archived ? new Date() : null, availableForSale: body.archived ? false : undefined } : {}),
    },
  });
  return NextResponse.json(variantRecordToVariant(updated));
}