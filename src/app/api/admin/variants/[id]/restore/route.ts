import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId, variantRecordToVariant } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  const updated = await prisma.productVariant.update({ where: { id }, data: { deletedAt: null } });
  return NextResponse.json(variantRecordToVariant(updated));
}