'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/ui/Image';
import { ShoppingBag } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types/shopify';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  variant?: ProductVariant;
  priority?: boolean;
  showQuickAdd?: boolean;
}

export function ProductCard({ product, variant, priority = false, showQuickAdd = true }: ProductCardProps) {
  const { addToCart, isLoading: cartLoading } = useCart();
  const [quickAddLoading, setQuickAddLoading] = useState<string | null>(null);

  const primaryVariant = variant || product.variants.edges[0]?.node;
  const price = primaryVariant?.price.amount || product.priceRange.minVariantPrice.amount;
  const compareAtPrice = primaryVariant?.compareAtPrice?.amount;
  const currencyCode = primaryVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode;
  const available = primaryVariant?.availableForSale ?? product.availableForSale;
  const images = product.images.edges.map(({ node }) => node);
  const featuredImage = product.featuredImage;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!primaryVariant?.id || !available) return;
    
    setQuickAddLoading(primaryVariant.id);
    try {
      await addToCart(primaryVariant.id, 1);
    } finally {
      setQuickAddLoading(null);
    }
  };

  const onSale = compareAtPrice && compareAtPrice > price;

  return (
    <article className="group relative">
      {/* Product Image Container — photo first, flat */}
      <div className="relative overflow-hidden bg-cream-100">
        <Link
          href={`/products/${product.handle}`}
          aria-label={`${product.title}${onSale ? ' - Sale' : ''}`}
        >
          <ProductImage
            images={images}
            selectedVariantImage={featuredImage ? { url: featuredImage.url, altText: featuredImage.altText } : null}
            aspectRatio="4:5"
            priority={priority}
          />
        </Link>

        {/* Badges — flat, minimal */}
        {onSale && (
          <span className="absolute top-3 left-3 badge-gold text-caption z-10">
            Sale
          </span>
        )}

        {!available && (
          <div className="absolute inset-0 bg-cream-50/70 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="badge-sold-out">Sold Out</span>
          </div>
        )}

        {/* Quick Add — quiet hairline on hover */}
        {showQuickAdd && available && (
          <div className="absolute bottom-3 left-3 right-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
            <button
              onClick={handleQuickAdd}
              disabled={!primaryVariant?.id || quickAddLoading === primaryVariant?.id || cartLoading}
              className="w-full min-h-[44px] bg-cream-50 text-neutral-950 text-body-sm font-medium px-2 flex items-center justify-center gap-2 transition-colors hover:bg-neutral-950 hover:text-cream-50"
              aria-label={`Quick add ${product.title}`}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>{quickAddLoading === primaryVariant?.id ? 'Adding…' : 'Add to Bag'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Info — uncluttered */}
      <Link
        href={`/products/${product.handle}`}
        className="block pt-4 space-y-1.5"
      >
        <h3 className="font-heading text-body-lg font-medium tracking-tight text-neutral-950 line-clamp-1">
          {product.title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="price">{formatMoney(price, currencyCode)}</span>
          {onSale && (
            <span className="price-compare">{formatMoney(compareAtPrice!, currencyCode)}</span>
          )}
        </div>
      </Link>
    </article>
  );
}