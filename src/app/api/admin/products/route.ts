import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import type { CustomProductInput } from '@/types/admin';

export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const first = Math.min(Number(searchParams.get('first')) || 12, 100);
  const after = Number(searchParams.get('after')) || 0;
  const rows = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, skip: after, take: first + 1 });
  const hasNextPage = rows.length > first;
  const pageRows = rows.slice(0, first);
  return NextResponse.json({
    edges: pageRows.map((node) => ({ node: productRecordToProduct(node), cursor: node.id.toString() })),
    pageInfo: { hasNextPage, hasPreviousPage: after > 0, startCursor: pageRows[0]?.id.toString() ?? null, endCursor: pageRows.length > 0 ? pageRows[pageRows.length - 1].id.toString() : null },
  });
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
}

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await req.json().catch(() => ({})) as Partial<CustomProductInput>;
  if (!input.title || typeof input.price !== 'number') return NextResponse.json({ error: 'title and price are required' }, { status: 400 });

  const handle = input.handle || slugify(input.title);
  const images = Array.isArray(input.images) && input.images.length > 0 ? input.images : ['/placeholder.svg'];
  const price = input.price;

  const product = await prisma.product.create({
    data: {
      handle,
      title: input.title,
      description: input.description || '',
      descriptionHtml: `<p>${input.description || ''}</p>`,
      vendor: input.vendor || 'Style Statement by Shakthi Atelier',
      productType: input.productType || 'Jewelry',
      tags: input.tags || [],
      price,
      compareAtPrice: input.compareAtPrice ?? null,
      currencyCode: 'INR',
      totalInventory: input.totalInventory ?? 10,
      featuredImage: images[0],
      images,
      options: input.options && input.options.length > 0 ? input.options : [{ id: 'opt-0', name: 'Title', values: ['Default Title'] }],
      seo: { title: input.title, description: input.description || '' },
      publishedAt: new Date(),
    },
  });

  if (input.collectionHandle) {
    const collection = await prisma.collection.upsert({
      where: { handle: input.collectionHandle },
      update: {},
      create: { handle: input.collectionHandle, title: input.collectionHandle, description: '', descriptionHtml: '' },
    });
    await prisma.collectionItem.upsert({
      where: { collectionId_productId: { collectionId: collection.id, productId: product.id } },
      update: {},
      create: { collectionId: collection.id, productId: product.id, position: product.id },
    });
  }

  return NextResponse.json(productRecordToProduct(product), { status: 201 });
}