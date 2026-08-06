'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/ui/Image';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/lib/utils';
import { Heart, ShoppingBag, Star } from 'lucide-react';
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
    <article className="group relative bg-white rounded-lg border border-neutral-200/80 overflow-hidden transition-all duration-300 hover:shadow-soft hover:-translate-y-1">
      {/* Product Image Container */}
      <div className="relative overflow-hidden bg-cream-50">
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

        {/* Badges */}
        {onSale && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 badge-gold text-[10px] sm:text-caption px-2 py-0.5 shadow-subtle z-10">
            −{Math.round((1 - price / compareAtPrice!) * 100)}%
          </span>
        )}

        {!available && (
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="badge-sold-out text-caption sm:text-body-sm px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-neutral-900 shadow-soft">Sold Out</span>
          </div>
        )}

        {/* Quick Add Button */}
        {showQuickAdd && available && (
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0 transition-all duration-300 ease-out z-10">
            <button
              onClick={handleQuickAdd}
              disabled={!primaryVariant?.id || quickAddLoading === primaryVariant?.id || cartLoading}
              className="w-full btn-primary text-[11px] sm:text-body-sm py-1.5 sm:py-2.5 min-h-[36px] sm:min-h-[42px] px-2 shadow-medium flex items-center justify-center gap-1.5"
              aria-label={`Quick add ${product.title}`}
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>{quickAddLoading === primaryVariant?.id ? 'Adding...' : 'Quick Add'}</span>
            </button>
          </div>
        )}

        {/* Wishlist Icon */}
        <button
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full text-neutral-500 hover:text-red-500 hover:bg-white transition-all duration-200 shadow-subtle opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10"
          aria-label="Add to wishlist"
        >
          <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Product Info */}
      <Link
        href={`/products/${product.handle}`}
        className="block p-2.5 sm:p-4 space-y-1 sm:space-y-1.5"
      >
        {/* Rating */}
        <div className="flex items-center gap-1 text-[11px] sm:text-caption text-gold-500 font-medium">
          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-gold-500" />
          <span>4.9</span>
          <span className="text-neutral-400 font-normal ml-0.5">(24)</span>
        </div>

        <h3 className="font-sans text-xs sm:text-body font-medium tracking-tight text-neutral-900 group-hover:text-gold-500 transition-colors line-clamp-1">
          {product.title}
        </h3>

        <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5">
          <span className="text-xs sm:text-body font-semibold text-neutral-950 tabular-nums">{formatMoney(price, currencyCode)}</span>
          {onSale && (
            <span className="text-[11px] sm:text-body-sm text-neutral-400 line-through tabular-nums">{formatMoney(compareAtPrice!, currencyCode)}</span>
          )}
        </div>
      </Link>
    </article>
  );
}