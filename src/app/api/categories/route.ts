import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJson } from '@/lib/db-mappers';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        handle: true,
        productType: true,
        tags: true,
        price: true,
        currencyCode: true,
        featuredImage: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const collections = await prisma.collection.findMany({
      select: { id: true, handle: true, title: true },
    });

    // Group products by productType
    const typeMap = new Map<string, typeof products>();
    for (const p of products) {
      const typeKey = (p.productType || 'Jewelry').trim();
      const existing = typeMap.get(typeKey) || [];
      existing.push(p);
      typeMap.set(typeKey, existing);
    }

    const categories = Array.from(typeMap.entries()).map(([typeName, typeProducts]) => {
      // Extract subcategories & tags for this productType
      const tagSet = new Set<string>();
      for (const p of typeProducts) {
        const pTags = parseJson<string[]>(p.tags, []);
        for (const t of pTags) {
          if (t && t.toLowerCase() !== typeName.toLowerCase()) {
            tagSet.add(t);
          }
        }
      }

      const subcategoryItems = Array.from(tagSet).slice(0, 8).map((tag) => ({
        label: tag.charAt(0).toUpperCase() + tag.slice(1),
        href: `/search?q=${encodeURIComponent(tag)}`,
      }));

      const topPicks = typeProducts.slice(0, 5).map((p) => ({
        label: p.title,
        href: `/products/${p.handle}`,
      }));

      const featuredProduct = typeProducts[0];
      let featuredImage = '/placeholder.svg';
      if (featuredProduct?.featuredImage && typeof featuredProduct.featuredImage === 'object') {
        const imgObj = featuredProduct.featuredImage as Record<string, unknown>;
        if (typeof imgObj.url === 'string') featuredImage = imgObj.url;
      }

      return {
        id: typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: typeName,
        href: `/search?q=${encodeURIComponent(typeName)}`,
        badge: typeProducts.length > 2 ? 'Popular' : undefined,
        subsections: [
          ...(subcategoryItems.length > 0
            ? [{ title: 'SUBCATEGORIES & TAGS', items: subcategoryItems }]
            : []),
          { title: 'FEATURED PRODUCTS', items: topPicks },
        ],
        featuredCard: featuredProduct
          ? {
              title: featuredProduct.title,
              subtitle: `Latest item in ${typeName}`,
              image: featuredImage,
              link: `/products/${featuredProduct.handle}`,
            }
          : undefined,
      };
    });

    return NextResponse.json({ categories, collections });
  } catch (err) {
    console.error('Error fetching dynamic categories:', err);
    return NextResponse.json({ categories: [], collections: [] }, { status: 500 });
  }
}
