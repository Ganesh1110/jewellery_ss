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
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={cn('product-grid', columnClasses[columns], className)} role="status" aria-label="Loading products">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full py-16 text-center">
        <p className="text-body text-neutral-500">No products found in this collection.</p>
      </div>
    );
  }

  return (
    <div className={cn('product-grid', columnClasses[columns], className)} role="list" aria-label="Products">
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
    <article className="card animate-pulse" aria-hidden="true">
      <div className="aspect-4-5 bg-neutral-200" />
      <div className="p-4 pt-5 space-y-3">
        <div className="h-3 w-24 bg-neutral-200 rounded" />
        <div className="h-5 w-3/4 bg-neutral-200 rounded" />
        <div className="h-5 w-1/2 bg-neutral-200 rounded" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-neutral-200 rounded" />
          <div className="h-4 w-16 bg-neutral-200 rounded" />
        </div>
      </div>
    </article>
  );
}