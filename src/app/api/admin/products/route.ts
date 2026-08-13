import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct, variantsInclude } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import { assertBarcodeUnique, assertSkuUnique, SkuConflictError, BarcodeConflictError } from '@/lib/variant-uniqueness';
import type { CustomProductInput, VariantInput } from '@/types/admin';

export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const first = Math.min(Number(searchParams.get('first')) || 12, 100);
  const after = Number(searchParams.get('after')) || 0;
  const rows = await prisma.product.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, skip: after, take: first + 1, include: variantsInclude });
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
  const input = await req.json().catch(() => ({})) as Partial<CustomProductInput> & { variants?: VariantInput[] };
  if (!input.title || typeof input.price !== 'number') return NextResponse.json({ error: 'title and price are required' }, { status: 400 });

  const handle = input.handle || slugify(input.title);
  const images = Array.isArray(input.images) && input.images.length > 0 ? input.images : ['/placeholder.svg'];
  const price = input.price;
  const title = input.title;
  const description = input.description || '';
  const vendor = input.vendor || 'Style Statement by Shakthi Atelier';
  const productType = input.productType || 'Jewelry';
  const tags = input.tags || [];
  const compareAtPrice = input.compareAtPrice ?? null;

  const variantSpecs: VariantInput[] = input.variants?.length
    ? input.variants
    : [{ title: 'Default Title', price, stock: input.totalInventory ?? 10 }];

  try {
    for (const v of variantSpecs) {
      if (v.sku) await assertSkuUnique(v.sku, null, prisma);
      if (v.barcode) await assertBarcodeUnique(v.barcode, null, prisma);
    }
  } catch (e) {
    if (e instanceof SkuConflictError || e instanceof BarcodeConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }

  const totalInventory = variantSpecs.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  const availableForSale = variantSpecs.some((v) => (v.stock ?? 0) > 0);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          handle,
          title,
          description,
          descriptionHtml: `<p>${description}</p>`,
          vendor,
          productType,
          tags,
          price,
          compareAtPrice,
          currencyCode: 'INR',
          totalInventory,
          availableForSale,
          featuredImage: images[0],
          images,
          options: input.options && input.options.length > 0 ? input.options : [{ id: 'opt-0', name: 'Title', values: ['Default Title'] }],
          seo: { title, description },
          publishedAt: new Date(),
        },
      });

      for (const v of variantSpecs) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            title: v.title || 'Default Title',
            sku: v.sku || null,
            barcode: v.barcode || null,
            price: v.price ?? price,
            compareAtPrice: v.compareAtPrice ?? null,
            currencyCode: 'INR',
            stock: v.stock ?? 0,
            lowStockThreshold: v.lowStockThreshold ?? 5,
            availableForSale: (v.stock ?? 0) > 0,
            selectedOptions: JSON.stringify(v.selectedOptions ?? []),
          },
        });
        if ((v.stock ?? 0) > 0) {
          await tx.inventoryMovement.create({
            data: { variantId: variant.id, type: 'RESTOCK', quantity: v.stock!, note: 'Initial stock', reference: 'admin' },
          });
        }
      }

      if (input.collectionHandle) {
        const collection = await tx.collection.upsert({
          where: { handle: input.collectionHandle },
          update: {},
          create: { handle: input.collectionHandle, title: input.collectionHandle, description: '', descriptionHtml: '' },
        });
        await tx.collectionItem.upsert({
          where: { collectionId_productId: { collectionId: collection.id, productId: product.id } },
          update: {},
          create: { collectionId: collection.id, productId: product.id, position: product.id },
        });
      }

      return product;
    });

    const product = await prisma.product.findUnique({
      where: { id: created.id },
      include: variantsInclude,
    });
    return NextResponse.json(productRecordToProduct(product!), { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: `Duplicate value: ${e.meta?.target}` }, { status: 409 });
    }
    throw e;
  }
}