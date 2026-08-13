import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId, movementRecordToMovement } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  const rows = await prisma.inventoryMovement.findMany({ where: { variantId: id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows.map(movementRecordToMovement));
}