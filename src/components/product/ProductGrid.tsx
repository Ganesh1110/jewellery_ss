'use client';

import { ProductCard } from './ProductCard';
import type { Product } from '@/types/shopify';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
  showQuickAdd?: boolean;
  className?: string;
}

export function ProductGrid({ products, loading = false, columns = 3, showQuickAdd = true, className }: ProductGridProps) {
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={cn('grid gap-x-3 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8', columnClasses[columns], className)} role="status" aria-label="Loading products">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center py-16 text-center">
        <p className="text-body text-neutral-500">No products found in this collection.</p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-x-3 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8', columnClasses[columns], className)} role="list" aria-label="Products">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4}
          showQuickAdd={showQuickAdd}
        />
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <article className="animate-pulse" aria-hidden="true">
      <div className="aspect-4-5 bg-cream-100" />
      <div className="pt-4 space-y-2">
        <div className="h-4 w-3/4 bg-cream-100 rounded-sm" />
        <div className="h-4 w-1/3 bg-cream-100 rounded-sm" />
      </div>
    </article>
  );
}