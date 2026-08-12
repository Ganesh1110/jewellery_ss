import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(amount);
}

export function formatMoneyRaw(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(amount);
}

export function getCurrencySymbol(currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value || currencyCode;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function parseHandle(url: string): string {
  const match = url.match(/\/([^/]+)\/?$/);
  return match ? match[1] : url;
}

export function getImageUrl(image: { url: string } | null, options?: { width?: number; height?: number }): string {
  if (!image?.url) return '/placeholder.svg';
  
  let url = image.url;
  
  // If it's a Shopify CDN URL, we can add size parameters
  if (url.includes('cdn.shopify.com') && options) {
    const { width, height } = options;
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('crop', 'center');
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${params.toString()}`;
  }
  
  return url;
}

export function getVariantImage(
  variant: { image: { url: string; altText: string | null } | null },
  productImages: Array<{ url: string; altText: string | null }>,
  options?: { width?: number; height?: number }
): { url: string; altText: string | null } {
  if (variant.image?.url) {
    return {
      url: getImageUrl(variant.image, options),
      altText: variant.image.altText,
    };
  }
  if (productImages.length > 0) {
    return {
      url: getImageUrl(productImages[0], options),
      altText: productImages[0].altText,
    };
  }
  return {
    url: '/placeholder.svg',
    altText: null,
  };
}

export function getSelectedVariant(
  product: { variants: { edges: Array<{ node: any }> } },
  selectedOptions: Record<string, string>
): any | null {
  for (const { node: variant } of product.variants.edges) {
    const matches = variant.selectedOptions.every(
      (option: { name: string; value: string }) => selectedOptions[option.name] === option.value
    );
    if (matches) return variant;
  }
  return null;
}

export function getVariantAvailability(variant: { availableForSale: boolean; quantityAvailable: number | null; lowStockThreshold?: number }): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  message: string;
} {
  if (!variant.availableForSale) return { status: 'out_of_stock', message: 'Sold out' };
  const threshold = variant.lowStockThreshold ?? 5;
  if (variant.quantityAvailable !== null && variant.quantityAvailable <= threshold) {
    return { status: 'low_stock', message: `Only ${variant.quantityAvailable} left` };
  }
  return { status: 'in_stock', message: 'In stock' };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function getAbsoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}