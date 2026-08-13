import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId, variantRecordToVariant } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import { applyMovement, InsufficientStockError } from '@/lib/inventory';
import type { MovementInput } from '@/types/admin';

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as MovementInput;
  const variantId = gidToId(body.variantId);
  if (variantId == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  if (!['RESTOCK', 'ADJUSTMENT', 'DAMAGE'].includes(body.type)) return NextResponse.json({ error: 'Invalid movement type' }, { status: 400 });
  if (!Number.isInteger(body.quantity) || body.quantity === 0) return NextResponse.json({ error: 'quantity must be a non-zero integer' }, { status: 400 });

  try {
    await applyMovement({ variantId, type: body.type, quantity: body.quantity, note: body.note ?? '', reference: 'admin' });
  } catch (e) {
    if (e instanceof InsufficientStockError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  return NextResponse.json({ ok: true, variant: variant ? variantRecordToVariant(variant) : null });
}