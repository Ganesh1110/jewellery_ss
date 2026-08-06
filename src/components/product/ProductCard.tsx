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
          <span className="absolute top-3 left-3 badge-gold shadow-subtle z-10">
            −{Math.round((1 - price / compareAtPrice!) * 100)}%
          </span>
        )}

        {!available && (
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="badge-sold-out text-body-sm px-4 py-2 bg-white text-neutral-900 shadow-soft">Sold Out</span>
          </div>
        )}

        {/* Quick Add Button */}
        {showQuickAdd && available && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out z-10">
            <button
              onClick={handleQuickAdd}
              disabled={!primaryVariant?.id || quickAddLoading === primaryVariant?.id || cartLoading}
              className="w-full btn-primary text-body-sm py-2.5 shadow-medium flex items-center justify-center gap-2"
              aria-label={`Quick add ${product.title}`}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {quickAddLoading === primaryVariant?.id ? 'Adding...' : 'Quick Add'}
            </button>
          </div>
        )}

        {/* Wishlist Icon */}
        <button
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-neutral-500 hover:text-red-500 hover:bg-white transition-all duration-200 shadow-subtle opacity-0 group-hover:opacity-100 z-10"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* Product Info */}
      <Link
        href={`/products/${product.handle}`}
        className="block p-4 space-y-1.5"
      >
        {/* Rating */}
        <div className="flex items-center gap-1 text-caption text-gold-500 font-medium">
          <Star className="h-3.5 w-3.5 fill-gold-500" />
          <span>4.9</span>
          <span className="text-neutral-400 font-normal ml-0.5">(24)</span>
        </div>

        <h3 className="font-sans text-body font-medium tracking-tight text-neutral-900 group-hover:text-gold-500 transition-colors line-clamp-1">
          {product.title}
        </h3>

        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="price">{formatMoney(price, currencyCode)}</span>
          {onSale && (
            <span className="price-compare">{formatMoney(compareAtPrice!, currencyCode)}</span>
          )}
        </div>
      </Link>
    </article>
  );
}