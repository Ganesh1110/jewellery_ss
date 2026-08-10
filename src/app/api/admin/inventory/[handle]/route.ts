import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import type { InventoryUpdate } from '@/types/admin';

export async function PATCH(req: Request, { params }: { params: { handle: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as InventoryUpdate;

  const existing = await prisma.product.findUnique({ where: { handle: params.handle } });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const totalInventory = body.totalInventory !== undefined ? Math.max(0, body.totalInventory) : existing.totalInventory;
  const updated = await prisma.product.update({
    where: { handle: params.handle },
    data: {
      totalInventory,
      availableForSale: body.availableForSale !== undefined ? body.availableForSale : totalInventory > 0,
      price: body.price !== undefined ? body.price : existing.price,
      compareAtPrice: body.compareAtPrice !== undefined ? body.compareAtPrice : existing.compareAtPrice,
    },
  });
  return NextResponse.json(productRecordToProduct(updated));
}