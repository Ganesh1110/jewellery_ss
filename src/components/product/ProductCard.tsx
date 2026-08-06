'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/ui/Image';
import { Button } from '@/components/ui/Button';
import { formatMoney, cn } from '@/lib/utils';
import { Heart, ShoppingBag } from 'lucide-react';
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
    <article className="card-interactive group relative">
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <Link
          href={`/products/${product.handle}`}
          aria-label={`${product.title}${onSale ? ' - On Sale' : ''}`}
        >
          <ProductImage
            images={images}
            selectedVariantImage={featuredImage ? { url: featuredImage.url, altText: featuredImage.altText } : null}
            aspectRatio="4:5"
            priority={priority}
          />
        </Link>

        {/* Sale Badge */}
        {onSale && (
          <span className="absolute top-3 left-3 badge-gold z-10">
            −{Math.round((1 - price / compareAtPrice!) * 100)}%
          </span>
        )}

        {/* Sold Out Overlay */}
        {!available && (
          <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center z-10">
            <span className="badge-sold-out text-body-sm px-4 py-2">Sold Out</span>
          </div>
        )}

        {/* Quick Add Button */}
        {showQuickAdd && available && (
          <button
            onClick={handleQuickAdd}
            disabled={!primaryVariant?.id || quickAddLoading === primaryVariant?.id || cartLoading}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-full max-w-[200px] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out-expo"
            aria-label={`Quick add ${product.title}`}
          >
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              loading={quickAddLoading === primaryVariant?.id}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Quick Add
            </Button>
          </button>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-neutral-500 hover:text-red-500 hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          aria-label="Add to wishlist"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {/* Product Info */}
      <Link
        href={`/products/${product.handle}`}
        className="block p-4 pt-5 space-y-2"
      >
        {product.productType && (
          <p className="overline text-gold-600">{product.productType}</p>
        )}

        <h3 className="font-heading text-heading-sm tracking-tight text-neutral-950 group-hover:text-gold-600 transition-colors line-clamp-1">
          {product.title}
        </h3>

        <div className="flex items-center gap-2">
          <span className="price tabular-nums">{formatMoney(price, currencyCode)}</span>
          {onSale && (
            <span className="price-compare tabular-nums">{formatMoney(compareAtPrice!, currencyCode)}</span>
          )}
        </div>
      </Link>
    </article>
  );
}