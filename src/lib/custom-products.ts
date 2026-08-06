import type { Product, ProductVariant } from '@/types/shopify';

const CUSTOM_PRODUCTS_KEY = 'sss_custom_products';

export interface CustomProductInput {
  title: string;
  handle?: string;
  description: string;
  productType: string;
  vendor: string;
  price: number;
  compareAtPrice?: number;
  collectionHandle: string;
  tags: string[];
  images: string[];
  totalInventory?: number;
  options?: Array<{ name: string; values: string[] }>;
}

export function getCustomProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse custom products:', err);
    return [];
  }
}

export function saveCustomProduct(input: CustomProductInput): Product {
  const handle =
    input.handle ||
    input.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const id = `gid://shopify/Product/custom-${Date.now()}`;
  const currencyCode = 'INR';

  const imagesNodes = (input.images.length > 0 ? input.images : ['/placeholder.svg']).map(
    (url, idx) => ({
      node: {
        id: `${id}-image-${idx}`,
        url,
        altText: input.title,
        width: 1200,
        height: 1500,
      },
    })
  );

  const featuredImage = imagesNodes[0]?.node || null;

  const defaultVariant: ProductVariant = {
    id: `${id}-variant-default`,
    title: 'Default Variant',
    availableForSale: (input.totalInventory ?? 10) > 0,
    quantityAvailable: input.totalInventory ?? 10,
    selectedOptions: [{ name: 'Title', value: 'Default Title' }],
    price: { amount: input.price, currencyCode },
    compareAtPrice: input.compareAtPrice ? { amount: input.compareAtPrice, currencyCode } : null,
    image: featuredImage,
    sku: `SKU-${handle.toUpperCase()}`,
  };

  const product: Product = {
    id,
    handle,
    title: input.title,
    description: input.description,
    descriptionHtml: `<p>${input.description}</p>`,
    vendor: input.vendor || 'Style Statement by Shakthi',
    productType: input.productType || 'Jewelry',
    tags: input.tags.length > 0 ? input.tags : ['custom', input.collectionHandle],
    availableForSale: (input.totalInventory ?? 10) > 0,
    totalInventory: input.totalInventory ?? 10,
    images: {
      edges: imagesNodes,
      pageInfo: { hasNextPage: false },
    },
    featuredImage,
    options: input.options && input.options.length > 0 ? input.options.map((opt, i) => ({ id: `opt-${i}`, name: opt.name, values: opt.values })) : [
      { id: 'opt-0', name: 'Title', values: ['Default Title'] },
    ],
    variants: {
      edges: [{ node: defaultVariant }],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    },
    priceRange: {
      minVariantPrice: { amount: input.price, currencyCode },
      maxVariantPrice: { amount: input.price, currencyCode },
    },
    compareAtPriceRange: input.compareAtPrice
      ? {
          minVariantPrice: { amount: input.compareAtPrice, currencyCode },
          maxVariantPrice: { amount: input.compareAtPrice, currencyCode },
        }
      : null,
    seo: {
      title: input.title,
      description: input.description,
    },
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  const current = getCustomProducts();
  const updated = [product, ...current.filter((p) => p.handle !== product.handle)];

  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(updated));
  }

  return product;
}

export function deleteCustomProduct(handle: string): void {
  if (typeof window === 'undefined') return;
  const current = getCustomProducts();
  const filtered = current.filter((p) => p.handle !== handle);
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(filtered));
}

const INVENTORY_OVERRIDES_KEY = 'sss_inventory_overrides';

export interface InventoryOverride {
  totalInventory: number;
  availableForSale: boolean;
  price?: number;
}

export function getInventoryOverrides(): Record<string, InventoryOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(INVENTORY_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse inventory overrides:', err);
    return {};
  }
}

export function updateProductInventory(handle: string, newInventory: number): void {
  if (typeof window === 'undefined') return;

  // 1. Update custom products if it exists there
  const customList = getCustomProducts();
  const targetIndex = customList.findIndex((p) => p.handle === handle);
  if (targetIndex !== -1) {
    const p = customList[targetIndex];
    p.totalInventory = newInventory;
    p.availableForSale = newInventory > 0;
    if (p.variants.edges[0]?.node) {
      p.variants.edges[0].node.quantityAvailable = newInventory;
      p.variants.edges[0].node.availableForSale = newInventory > 0;
    }
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customList));
  }

  // 2. Also save in inventory overrides map for mock/demo products
  const overrides = getInventoryOverrides();
  overrides[handle] = {
    ...overrides[handle],
    totalInventory: newInventory,
    availableForSale: newInventory > 0,
  };
  localStorage.setItem(INVENTORY_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function updateProductPrice(handle: string, newPrice: number): void {
  if (typeof window === 'undefined') return;

  const customList = getCustomProducts();
  const targetIndex = customList.findIndex((p) => p.handle === handle);
  if (targetIndex !== -1) {
    const p = customList[targetIndex];
    p.priceRange.minVariantPrice.amount = newPrice;
    p.priceRange.maxVariantPrice.amount = newPrice;
    if (p.variants.edges[0]?.node) {
      p.variants.edges[0].node.price.amount = newPrice;
    }
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customList));
  }

  const overrides = getInventoryOverrides();
  const currentOverride = overrides[handle] || { totalInventory: 10, availableForSale: true };
  overrides[handle] = {
    ...currentOverride,
    price: newPrice,
  };
  localStorage.setItem(INVENTORY_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function applyInventoryOverrides(product: Product): Product {
  const overrides = getInventoryOverrides();
  const override = overrides[product.handle];
  if (!override) return product;

  const updatedPrice = override.price ?? product.priceRange.minVariantPrice.amount;

  return {
    ...product,
    totalInventory: override.totalInventory,
    availableForSale: override.availableForSale,
    priceRange: {
      ...product.priceRange,
      minVariantPrice: { ...product.priceRange.minVariantPrice, amount: updatedPrice },
      maxVariantPrice: { ...product.priceRange.maxVariantPrice, amount: updatedPrice },
    },
    variants: {
      ...product.variants,
      edges: product.variants.edges.map((edge) => ({
        ...edge,
        node: {
          ...edge.node,
          quantityAvailable: override.totalInventory,
          availableForSale: override.availableForSale,
          price: { ...edge.node.price, amount: updatedPrice },
        },
      })),
    },
  };
}
