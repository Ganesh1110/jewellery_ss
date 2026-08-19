import { prisma } from './prisma';
import type {
  Product,
  ProductConnection,
  Collection,
  CollectionConnection,
  Menu,
  Shop,
  Article,
  ArticleConnection,
  Blog,
} from '@/types/shopify';
import {
  productRecordToProduct,
  collectionRecordToCollection,
  articleRecordToArticle,
  buildShop,
  buildMenus,
  parseAfter,
  variantsInclude,
} from './db-mappers';

function sortOrder(sortKey?: string, reverse = false) {
  const dir = reverse ? 'desc' : 'asc';
  switch (sortKey) {
    case 'TITLE_ASC':
      return { title: dir } as const;
    case 'TITLE_DESC':
      return { title: dir } as const;
    case 'PRICE_ASC':
      return { price: dir } as const;
    case 'PRICE_DESC':
      return { price: dir } as const;
    case 'CREATED_DESC':
      return { createdAt: dir } as const;
    default:
      return { createdAt: 'desc' as const };
  }
}

function matchesQuery(p: Product, query: string): boolean {
  const q = query.toLowerCase();
  return (
    p.title.toLowerCase().includes(q) ||
    p.productType.toLowerCase().includes(q) ||
    p.vendor.toLowerCase().includes(q) ||
    p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function sortInStockFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const aInStock = a.availableForSale && (a.totalInventory ?? 0) > 0;
    const bInStock = b.availableForSale && (b.totalInventory ?? 0) > 0;
    if (aInStock === bInStock) return 0;
    return aInStock ? -1 : 1;
  });
}

export async function fetchProducts(
  first = 10,
  after?: string,
  sortKey?: string,
  reverse = false,
  query?: string
): Promise<ProductConnection> {
  const skip = parseAfter(after);
  const rows = await prisma.product.findMany({ where: { deletedAt: null }, orderBy: sortOrder(sortKey, reverse), take: skip + first + 20, include: variantsInclude });
  let products = rows.map((p) => productRecordToProduct(p));
  if (query) products = products.filter((p) => matchesQuery(p, query));
  products = sortInStockFirst(products);
  const hasNextPage = products.length > skip + first;
  products = products.slice(skip, skip + first);

  return {
    edges: products.slice(0, first).map((node) => ({ node, cursor: node.id })),
    pageInfo: {
      hasNextPage,
      hasPreviousPage: skip > 0,
      startCursor: products.length > 0 ? products[0].id : null,
      endCursor: products.length > 0 ? products[products.length - 1].id : null,
    },
  };
}

export async function fetchProduct(handle: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { handle }, include: variantsInclude });
  return row ? productRecordToProduct(row) : null;
}

export async function fetchProductRecommendations(productId: string): Promise<Product[]> {
  const id = Number(productId.split('/').pop());
  const rows = await prisma.product.findMany({ where: { id: { not: id }, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 4, include: variantsInclude });
  const products = rows.map((p) => productRecordToProduct(p));
  return sortInStockFirst(products);
}

export async function fetchCollections(first = 20, after?: string): Promise<CollectionConnection> {
  const skip = parseAfter(after);
  const rows = await prisma.collection.findMany({ orderBy: { title: 'asc' }, skip, take: first + 1 });
  const hasNextPage = rows.length > first;
  const pageRows = rows.slice(0, first);
  return {
    edges: pageRows.map((node) => ({ node: collectionRecordToCollection(node, []), cursor: node.id.toString() })),
    pageInfo: { hasNextPage, hasPreviousPage: skip > 0 },
  };
}

export async function fetchCollection(handle: string, first = 10, after?: string, sortKey?: string): Promise<Collection | null> {
  const skip = parseAfter(after);

  if (handle === 'all') {
    const rows = await prisma.product.findMany({ where: { deletedAt: null }, orderBy: sortOrder(sortKey), take: skip + first + 20, include: variantsInclude });
    let products = rows.map((p) => productRecordToProduct(p));
    products = sortInStockFirst(products);
    const hasNextPage = products.length > skip + first;
    products = products.slice(skip, skip + first);
    return {
      id: 'gid://db/Collection/all',
      handle: 'all',
      title: 'All Jewelry',
      description: 'Every piece in our collection.',
      descriptionHtml: '',
      image: null,
      seo: { title: 'All Jewelry', description: 'Every piece in our collection.' },
      updatedAt: new Date().toISOString(),
      products: { edges: products.map((node) => ({ node, cursor: node.id })), pageInfo: { hasNextPage, hasPreviousPage: skip > 0, startCursor: null, endCursor: null } },
    };
  }

  if (handle === 'bestsellers') {
    const rows = await prisma.product.findMany({ where: { compareAtPrice: { not: null }, deletedAt: null }, orderBy: sortOrder(sortKey), take: skip + first + 20, include: variantsInclude });
    let products = rows.map((p) => productRecordToProduct(p));
    products = sortInStockFirst(products);
    const hasNextPage = products.length > skip + first;
    products = products.slice(skip, skip + first);
    return {
      id: 'gid://db/Collection/bestsellers',
      handle: 'bestsellers',
      title: 'Bestsellers',
      description: 'The pieces our collectors love most.',
      descriptionHtml: '',
      image: null,
      seo: { title: 'Bestsellers', description: 'The pieces our collectors love most.' },
      updatedAt: new Date().toISOString(),
      products: { edges: products.map((node) => ({ node, cursor: node.id })), pageInfo: { hasNextPage, hasPreviousPage: skip > 0, startCursor: null, endCursor: null } },
    };
  }

  const collection = await prisma.collection.findUnique({
    where: { handle },
    include: { items: { include: { product: { include: variantsInclude } }, orderBy: { position: 'asc' } } },
  });
  if (!collection) return null;

  let allProducts = collection.items.map((item) => item.product).map((p) => productRecordToProduct(p));
  allProducts = sortInStockFirst(allProducts);
  const paginated = allProducts.slice(skip, skip + first);
  const hasNextPage = allProducts.length > skip + first;
  return collectionRecordToCollection(collection, paginated);
}

export async function fetchMenu(handle: string): Promise<Menu | null> {
  const collections = await prisma.collection.findMany({ orderBy: { title: 'asc' } });
  return buildMenus(collections).find((m) => m.handle === handle) || null;
}

export async function fetchMenus(): Promise<Menu[]> {
  const collections = await prisma.collection.findMany({ orderBy: { title: 'asc' } });
  return buildMenus(collections);
}

export async function fetchShop(): Promise<Shop> {
  const settings = await prisma.setting.findMany();
  return buildShop(settings);
}

export async function fetchBlogs(first = 10): Promise<Array<{ id: string; handle: string; title: string }>> {
  const rows = await prisma.blog.findMany({ take: first });
  return rows.map((b) => ({ id: `${b.id}`, handle: b.handle, title: b.title }));
}

export async function fetchArticles(blogHandle: string, first = 10, after?: string): Promise<ArticleConnection> {
  const skip = parseAfter(after);
  const blog = await prisma.blog.findUnique({ where: { handle: blogHandle } });
  if (!blog) return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } };
  const rows = await prisma.article.findMany({ where: { blogId: blog.id }, orderBy: { publishedAt: 'desc' }, skip, take: first + 1 });
  const hasNextPage = rows.length > first;
  const edges = rows.slice(0, first).map((node) => ({ node: articleRecordToArticle(node), cursor: node.id.toString() }));
  return { edges, pageInfo: { hasNextPage, hasPreviousPage: skip > 0 } };
}

export async function fetchArticle(blogHandle: string, articleHandle: string): Promise<Article | null> {
  const blog = await prisma.blog.findUnique({ where: { handle: blogHandle } });
  if (!blog) return null;
  const row = await prisma.article.findUnique({ where: { blogId_handle: { blogId: blog.id, handle: articleHandle } } });
  return row ? articleRecordToArticle(row) : null;
}