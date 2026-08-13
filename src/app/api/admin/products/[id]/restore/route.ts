import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct, gidToId, variantsInclude } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Un-archive the product AND all of its variants
  await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { deletedAt: null },
    }),
    prisma.productVariant.updateMany({
      where: { productId: id },
      data: { deletedAt: null, availableForSale: true },
    }),
  ]);

  const updated = await prisma.product.findUnique({
    where: { id },
    include: variantsInclude,
  });

  return NextResponse.json(productRecordToProduct(updated!));
}
