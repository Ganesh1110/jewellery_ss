import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId, variantRecordToVariant } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  const existing = await prisma.productVariant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  const [updated] = await prisma.$transaction([
    prisma.productVariant.update({ where: { id }, data: { deletedAt: null, availableForSale: existing.stock > 0 } }),
    prisma.product.update({ where: { id: existing.productId }, data: { deletedAt: null } }),
  ]);
  return NextResponse.json(variantRecordToVariant(updated));
}