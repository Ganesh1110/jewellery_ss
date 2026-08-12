import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct, gidToId, variantsInclude } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import type { InventoryUpdate } from '@/types/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  const body = await req.json().catch(() => ({})) as InventoryUpdate;

  const existing = await prisma.product.findUnique({ where: { id }, include: variantsInclude });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const totalInventory = body.totalInventory !== undefined ? Math.max(0, body.totalInventory) : existing.totalInventory;
  const updated = await prisma.product.update({
    where: { id },
    data: {
      totalInventory,
      availableForSale: body.availableForSale !== undefined ? body.availableForSale : totalInventory > 0,
      price: body.price !== undefined ? body.price : existing.price,
      compareAtPrice: body.compareAtPrice !== undefined ? body.compareAtPrice : existing.compareAtPrice,
    },
    include: variantsInclude,
  });
  return NextResponse.json(productRecordToProduct(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  await prisma.product.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}