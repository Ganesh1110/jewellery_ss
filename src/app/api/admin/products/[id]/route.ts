import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct, gidToId } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';

interface ProductBaseUpdate {
  price?: number;
  compareAtPrice?: number | null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  const body = await req.json().catch(() => ({})) as ProductBaseUpdate;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const updated = await prisma.product.update({
    where: { id },
    data: {
      price: body.price !== undefined ? body.price : existing.price,
      compareAtPrice: body.compareAtPrice !== undefined ? body.compareAtPrice : existing.compareAtPrice,
    },
    include: { variants: { where: { deletedAt: null }, orderBy: { position: 'asc' } } },
  });
  return NextResponse.json(productRecordToProduct(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  await prisma.$transaction([
    prisma.product.update({ where: { id }, data: { deletedAt: new Date() } }),
    prisma.productVariant.updateMany({ where: { productId: id }, data: { deletedAt: new Date(), availableForSale: false } }),
  ]);
  return NextResponse.json({ ok: true });
}