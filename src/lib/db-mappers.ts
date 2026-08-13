import type { Prisma, Product as DbProduct, ProductVariant as DbProductVariant, Collection as DbCollection, Cart as DbCart, CartItem as DbCartItem, Article as DbArticle, Setting, InventoryMovement as DbInventoryMovement } from '@prisma/client';
import type { Image, Product, ProductVariant, SelectedOption, Cart, CartLine, Collection, Article, Shop, Menu, MenuItem } from '@/types/shopify';
import type { InventoryMovementView } from '@/types/admin';

export const GID_PREFIX = 'gid://db';

export function gidToId(gid: string): number | null {
  const n = Number(gid.split('/').pop());
  return Number.isNaN(n) ? null : n;
}

export function parseJson<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function parseAfter(after?: string): number {
  if (!after) return 0;
  const n = Number(after);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export function toImage(json: Prisma.JsonValue | null): Image | null {
  const parsed = parseJson<Record<string, unknown> | null>(json, null);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const o = parsed;
  if (typeof o.url !== 'string') return null;
  return {
    id: typeof o.id === 'string' ? o.id : '',
    url: o.url,
    altText: typeof o.altText === 'string' ? o.altText : null,
    width: typeof o.width === 'number' ? o.width : 1200,
    height: typeof o.height === 'number' ? o.height : 1500,
  };
}

export const variantsInclude = {
  variants: { where: { deletedAt: null }, orderBy: { position: 'asc' as const } },
};

export const allVariantsInclude = {
  variants: { orderBy: { position: 'asc' as const } },
};

export function variantRecordToVariant(v: DbProductVariant): ProductVariant {
  const price = Number(v.price);
  const compare = v.compareAtPrice != null ? Number(v.compareAtPrice) : null;
  const selectedOptions = parseJson<SelectedOption[]>(v.selectedOptions, []);
  return {
    id: `${GID_PREFIX}/ProductVariant/${v.id}`,
    title: v.title,
    availableForSale: v.availableForSale,
    quantityAvailable: v.stock,
    selectedOptions,
    price: { amount: price, currencyCode: v.currencyCode },
    compareAtPrice: compare != null ? { amount: compare, currencyCode: v.currencyCode } : null,
    image: toImage(v.image),
    sku: v.sku,
    barcode: v.barcode,
    lowStockThreshold: v.lowStockThreshold,
    archived: v.deletedAt != null,
  };
}

export function movementRecordToMovement(m: DbInventoryMovement): InventoryMovementView {
  return { id: m.id, variantId: m.variantId, type: m.type, quantity: m.quantity, note: m.note, reference: m.reference, createdAt: m.createdAt.toISOString() };
}

export function productRecordToProduct(p: DbProduct & { variants?: DbProductVariant[] }, opts?: { includeArchived?: boolean }): Product {
  const allVariants = p.variants ?? [];
  const liveVariants = allVariants.filter((v) => !v.deletedAt);
  const variants = opts?.includeArchived ? allVariants : liveVariants;
  const edges = variants.map((node) => ({ node: variantRecordToVariant(node) }));
  const prices = liveVariants.map((v) => Number(v.price));
  const min = prices.length ? Math.min(...prices) : Number(p.price);
  const max = prices.length ? Math.max(...prices) : Number(p.price);
  const totalInventory = liveVariants.reduce((s, v) => s + v.stock, 0);
  const currency = liveVariants[0]?.currencyCode || p.currencyCode;
  const images = parseJson<Prisma.JsonValue[]>(p.images, []);
  const imageNodes = images.map((n) => toImage(n)).filter((n): n is Image => n !== null);
  const tags = parseJson<string[]>(p.tags, []);
  const options = parseJson<Array<{ id?: string; name: string; values: string[] }>>(p.options, []);
  const seo = (p.seo && typeof p.seo === 'object' ? p.seo : {}) as Record<string, unknown>;

  return {
    id: `${GID_PREFIX}/Product/${p.id}`,
    handle: p.handle,
    title: p.title,
    description: p.description,
    descriptionHtml: p.descriptionHtml,
    vendor: p.vendor,
    productType: p.productType,
    tags,
    availableForSale: liveVariants.some((v) => v.availableForSale && v.stock > 0),
    totalInventory,
    images: { edges: imageNodes.map((node) => ({ node })), pageInfo: { hasNextPage: false } },
    featuredImage: toImage(p.featuredImage),
    options: options.map((o, i) => ({ id: o.id || `${GID_PREFIX}/ProductOption/${p.id}-${i}`, name: o.name, values: o.values })),
    variants: { edges, pageInfo: { hasNextPage: false, hasPreviousPage: false } },
    priceRange: { minVariantPrice: { amount: min, currencyCode: currency }, maxVariantPrice: { amount: max, currencyCode: currency } },
    compareAtPriceRange: null,
    seo: { title: (seo.title as string) ?? null, description: (seo.description as string) ?? null },
    updatedAt: p.updatedAt.toISOString(),
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  };
}

export function collectionRecordToCollection(c: DbCollection, products: Product[]): Collection {
  const seo = (c.seo && typeof c.seo === 'object' ? c.seo : {}) as Record<string, unknown>;
  return {
    id: `${GID_PREFIX}/Collection/${c.id}`,
    handle: c.handle,
    title: c.title,
    description: c.description,
    descriptionHtml: c.descriptionHtml,
    image: toImage(c.image),
    seo: { title: (seo.title as string) ?? null, description: (seo.description as string) ?? null },
    updatedAt: c.updatedAt.toISOString(),
    products: {
      edges: products.map((node) => ({ node, cursor: node.id })),
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    },
  };
}

export function cartRecordToCart(cart: DbCart, items: Array<DbCartItem & { variant: DbProductVariant & { product: DbProduct } }>): Cart {
  const edges = items
    .filter((item) => item.quantity > 0)
    .map((item): { node: CartLine } => {
      const merchandise = variantRecordToVariant(item.variant);
      const amount = Number(item.variant.price) * item.quantity;
      return {
        node: {
          id: `${GID_PREFIX}/CartLine/${item.id}`,
          quantity: item.quantity,
          merchandise,
          cost: { totalAmount: { amount, currencyCode: merchandise.price.currencyCode }, amountPerQuantity: { amount: Number(item.variant.price), currencyCode: merchandise.price.currencyCode } },
          attributes: [],
          discounts: [],
        },
      };
    });
  const subtotal = edges.reduce((sum, e) => sum + e.node.cost.totalAmount.amount, 0);
  const currency = edges[0]?.node.merchandise.price.currencyCode || 'INR';
  const totalQuantity = edges.reduce((sum, e) => sum + e.node.quantity, 0);
  return {
    id: `${GID_PREFIX}/Cart/${cart.id}`,
    checkoutUrl: '/checkout',
    totalQuantity,
    lines: { edges },
    cost: { subtotalAmount: { amount: subtotal, currencyCode: currency }, totalAmount: { amount: subtotal, currencyCode: currency }, totalTaxAmount: null, totalDutyAmount: null },
    discountCodes: [],
    buyerIdentity: { countryCode: null, email: null, phone: null },
    attributes: [],
    note: cart.note,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

export function articleRecordToArticle(a: DbArticle): Article {
  const seo = (a.seo && typeof a.seo === 'object' ? a.seo : {}) as Record<string, unknown>;
  return {
    id: `${GID_PREFIX}/Article/${a.id}`,
    handle: a.handle,
    title: a.title,
    excerpt: a.excerpt,
    contentHtml: a.contentHtml,
    image: toImage(a.image),
    author: { name: a.author, bio: null, image: null },
    publishedAt: a.publishedAt.toISOString(),
    blog: { id: `${GID_PREFIX}/Blog/${a.blogId}`, handle: 'journal', title: 'Journal' },
    seo: { title: (seo.title as string) ?? null, description: (seo.description as string) ?? null },
  };
}

export function buildShop(settings: Setting[]): Shop {
  const get = (key: string, fallback = '') => settings.find((s) => s.key === key)?.value ?? fallback;
  return {
    name: get('shop.name', 'Style Statement by Shakthi'),
    description: get('shop.description', ''),
    brand: { logo: null, coverImage: null, shortDescription: get('shop.shortDescription', '') || null },
    primaryDomain: { url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', host: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/^https?:\/\//, '') },
    currencyCode: get('shop.currencyCode', 'INR'),
    countriesInShipping: ['IN', 'US', 'GB', 'AE', 'SG'],
    paymentSettings: { acceptedPaymentMethods: ['visa', 'master', 'american_express', 'paypal', 'unionpay'] },
    policies: {
      privacyPolicy: { id: 'gid://db/Policy/privacy', title: 'Privacy Policy', body: '', url: '/privacy-policy' },
      refundPolicy: { id: 'gid://db/Policy/refund', title: 'Refund Policy', body: '', url: '/refund-policy' },
      termsOfService: { id: 'gid://db/Policy/terms', title: 'Terms of Service', body: '', url: '/terms-of-service' },
      shippingPolicy: { id: 'gid://db/Policy/shipping', title: 'Shipping Policy', body: '', url: '/shipping-policy' },
    },
  };
}

export function buildMenus(collections: DbCollection[]): Menu[] {
  const shopItems: MenuItem[] = collections
    .filter((c) => c.handle !== 'all')
    .slice(0, 5)
    .map((c) => ({ id: `gid://db/MenuItem/${c.handle}`, title: c.title, url: `/collections/${c.handle}`, resourceType: 'COLLECTION' }));
  return [
    {
      id: 'gid://db/Menu/main-menu',
      handle: 'main-menu',
      title: 'Main Menu',
      items: [
        { id: 'gid://db/MenuItem/shop', title: 'Shop', url: '/collections', resourceType: 'COLLECTION', items: shopItems },
        {
          id: 'gid://db/MenuItem/explore',
          title: 'Explore',
          url: '/journal',
          resourceType: 'LINK',
          items: [
            { id: 'gid://db/MenuItem/journal', title: 'Journal', url: '/journal', resourceType: 'LINK' },
            { id: 'gid://db/MenuItem/about', title: 'Our Story', url: '/about', resourceType: 'LINK' },
            { id: 'gid://db/MenuItem/contact', title: 'Contact', url: '/contact', resourceType: 'LINK' },
          ],
        },
      ],
    },
  ];
}