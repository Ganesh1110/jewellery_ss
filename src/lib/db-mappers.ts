import type { Prisma, Product as DbProduct, Collection as DbCollection, Cart as DbCart, CartItem as DbCartItem, Article as DbArticle, Setting } from '@prisma/client';
import type { Image, Product, ProductVariant, Cart, CartLine, Collection, Article, Shop, Menu, MenuItem } from '@/types/shopify';

export const GID_PREFIX = 'gid://db';

export function gidToId(gid: string): number | null {
  const n = Number(gid.split('/').pop());
  return Number.isNaN(n) ? null : n;
}

export function parseAfter(after?: string): number {
  if (!after) return 0;
  const n = Number(after);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export function toImage(json: Prisma.JsonValue | null): Image | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  if (typeof o.url !== 'string') return null;
  return {
    id: typeof o.id === 'string' ? o.id : '',
    url: o.url,
    altText: typeof o.altText === 'string' ? o.altText : null,
    width: typeof o.width === 'number' ? o.width : 1200,
    height: typeof o.height === 'number' ? o.height : 1500,
  };
}

function variantForProduct(p: DbProduct): ProductVariant {
  const price = Number(p.price);
  const compare = p.compareAtPrice != null ? Number(p.compareAtPrice) : null;
  return {
    id: `${GID_PREFIX}/ProductVariant/${p.id}`,
    title: 'Default Title',
    availableForSale: p.availableForSale,
    quantityAvailable: p.totalInventory,
    selectedOptions: [{ name: 'Default', value: 'Default Title' }],
    price: { amount: price, currencyCode: p.currencyCode },
    compareAtPrice: compare != null ? { amount: compare, currencyCode: p.currencyCode } : null,
    image: toImage(p.featuredImage),
    sku: null,
  };
}

export function productRecordToProduct(p: DbProduct): Product {
  const price = Number(p.price);
  const compare = p.compareAtPrice != null ? Number(p.compareAtPrice) : null;
  const images = (Array.isArray(p.images) ? p.images : []) as Prisma.JsonValue[];
  const imageNodes = images.map((n) => toImage(n)).filter((n): n is Image => n !== null);
  const tags = (Array.isArray(p.tags) ? p.tags : []) as string[];
  const options = (Array.isArray(p.options) ? p.options : []) as Array<{ id?: string; name: string; values: string[] }>;
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
    availableForSale: p.availableForSale,
    totalInventory: p.totalInventory,
    images: { edges: imageNodes.map((node) => ({ node })), pageInfo: { hasNextPage: false } },
    featuredImage: toImage(p.featuredImage),
    options: options.map((o, i) => ({ id: o.id || `${GID_PREFIX}/ProductOption/${p.id}-${i}`, name: o.name, values: o.values })),
    variants: { edges: [{ node: variantForProduct(p) }], pageInfo: { hasNextPage: false, hasPreviousPage: false } },
    priceRange: { minVariantPrice: { amount: price, currencyCode: p.currencyCode }, maxVariantPrice: { amount: price, currencyCode: p.currencyCode } },
    compareAtPriceRange: compare != null ? { minVariantPrice: { amount: compare, currencyCode: p.currencyCode }, maxVariantPrice: { amount: compare, currencyCode: p.currencyCode } } : null,
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

export function cartRecordToCart(cart: DbCart, items: Array<DbCartItem & { product: DbProduct }>): Cart {
  const edges = items
    .filter((item) => item.quantity > 0)
    .map((item): { node: CartLine } => {
      const p = item.product;
      const price = Number(p.price);
      const variant = variantForProduct(p);
      return {
        node: {
          id: `${GID_PREFIX}/CartLine/${item.id}`,
          quantity: item.quantity,
          merchandise: variant,
          cost: { totalAmount: { amount: price * item.quantity, currencyCode: p.currencyCode }, amountPerQuantity: { amount: price, currencyCode: p.currencyCode } },
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