'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Share2, Truck, RotateCcw, Shield, Check } from 'lucide-react';
import { ProductGallery, VariantSelector, QuantitySelector, AddToCartButton } from '@/components/product/ProductDetail';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useCart } from '@/context/CartContext';
import { formatMoney, getSelectedVariant, getVariantAvailability, cn } from '@/lib/utils';
import type { Product } from '@/types/shopify';

export function ProductDetailsClient({
  product,
  recommendations,
}: {
  product: Product;
  recommendations: Product[];
}) {
  const { addToCart, isLoading: cartLoading } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Initialize selected options with first available variant
  useEffect(() => {
    if (product.variants.edges.length > 0) {
      const firstVariant = product.variants.edges[0].node;
      const initialOptions: Record<string, string> = {};
      firstVariant.selectedOptions.forEach((opt) => {
        initialOptions[opt.name] = opt.value;
      });
      setSelectedOptions(initialOptions);
    }
  }, [product]);

  const selectedVariant = useMemo(
    () => getSelectedVariant(product, selectedOptions),
    [product, selectedOptions]
  );

  const availability = selectedVariant
    ? getVariantAvailability(selectedVariant)
    : { status: 'out_of_stock' as const, message: 'Unavailable' };

  const price = selectedVariant?.price.amount || product.priceRange.minVariantPrice.amount;
  const compareAtPrice = selectedVariant?.compareAtPrice?.amount;
  const currencyCode = selectedVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode;
  const onSale = compareAtPrice && compareAtPrice > price;

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant?.id || availability.status === 'out_of_stock') return;

    await addToCart(selectedVariant.id, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <nav className="section-sm bg-white border-b border-neutral-200" aria-label="Breadcrumb">
        <div className="container">
          <ol className="flex items-center gap-2 text-caption text-neutral-500">
            <li><Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/collections" className="hover:text-neutral-950 transition-colors">Collections</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/collections" className="hover:text-neutral-950 transition-colors">
              {product.productType || 'Collections'}
            </Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-950 font-medium truncate max-w-[200px]">{product.title}</li>
          </ol>
        </div>
      </nav>

      {/* Product Content */}
      <section className="section bg-white" aria-labelledby="product-title">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Gallery */}
            <div className="lg:sticky lg:top-24">
              <ProductGallery
                product={product}
                selectedVariant={selectedVariant}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
              />
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              {/* Category */}
              {product.productType && (
                <p className="overline text-neutral-600">{product.productType}</p>
              )}

              {/* Title */}
              <h1 id="product-title" className="font-heading text-display-sm tracking-tight text-neutral-950">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="price text-display-sm tabular-nums">{formatMoney(price, currencyCode)}</span>
                {onSale && compareAtPrice && (
                  <span className="price-compare text-heading-md tabular-nums">{formatMoney(compareAtPrice, currencyCode)}</span>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 text-body-sm">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  availability.status === 'in_stock' && 'bg-neutral-950',
                  availability.status === 'low_stock' && 'bg-amber-600',
                  availability.status === 'out_of_stock' && 'bg-neutral-400'
                )} aria-hidden="true" />
                <span className={cn(
                  availability.status === 'in_stock' && 'text-neutral-700',
                  availability.status === 'low_stock' && 'text-amber-700',
                  availability.status === 'out_of_stock' && 'text-neutral-500'
                )}>
                  {availability.message}
                </span>
              </div>

              {/* Description */}
              <div className="text-body text-neutral-600 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml || product.description }} />
              </div>

              {/* Variant Selector */}
              {product.options.length > 0 && (
                <VariantSelector
                  product={product}
                  selectedOptions={selectedOptions}
                  onOptionChange={handleOptionChange}
                  disabled={availability.status === 'out_of_stock'}
                />
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4 items-start pt-8 border-t border-neutral-950/10">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  max={selectedVariant?.quantityAvailable || 99}
                  disabled={availability.status === 'out_of_stock'}
                />
                <div className="flex-1 sm:w-auto">
                  <AddToCartButton
                    onClick={handleAddToCart}
                    loading={cartLoading}
                    disabled={availability.status === 'out_of_stock'}
                    className="w-full sm:w-auto min-w-[180px]"
                  >
                    {addedToCart ? (
                      <>
                        <Check className="h-5 w-5" aria-hidden="true" />
                        Added to Bag
                      </>
                    ) : availability.status === 'out_of_stock' ? (
                      'Sold Out'
                    ) : (
                      'Add to Bag'
                    )}
                  </AddToCartButton>
                </div>
              </div>

              {/* Wishlist & Share */}
              <div className="flex items-center gap-6 pt-8 border-t border-neutral-950/10">
                <button className="inline-flex items-center gap-2 text-body-sm font-medium text-neutral-700 hover:text-neutral-950 transition-colors" aria-label="Add to wishlist">
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  Add to wishlist
                </button>
                <button className="inline-flex items-center gap-2 text-body-sm font-medium text-neutral-700 hover:text-neutral-950 transition-colors" aria-label="Share product">
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share
                </button>
              </div>

              {/* Service Note */}
              <div className="space-y-3 text-body-sm text-neutral-600 pt-2">
                <p className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  Complimentary shipping on orders over ₹15,000
                </p>
                <p className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  14-day complimentary returns
                </p>
                <p className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  Gemstones certified by IGI · GIA
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* You May Also Like */}
      {recommendations.length > 0 && (
        <section className="section bg-cream-50 border-y border-neutral-950/10" aria-labelledby="recommendations-heading">
          <div className="container">
            <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-20">
              <h2 id="recommendations-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight text-neutral-950 mb-4">
                You May Also Like
              </h2>
              <p className="text-body text-neutral-600">
                Handpicked pieces that complement your selection.
              </p>
            </header>
            <ProductGrid products={recommendations} columns={4} />
          </div>
        </section>
      )}

      {/* Sticky Mobile Add-to-Bag Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-cream-50/95 backdrop-blur-md border-t border-neutral-950/10 p-3.5 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-heading text-body-sm font-medium text-neutral-950 truncate">{product.title}</p>
            <p className="text-body-sm font-medium text-neutral-900 tabular-nums">{formatMoney(price, currencyCode)}</p>
          </div>
          <AddToCartButton
            onClick={handleAddToCart}
            loading={cartLoading}
            disabled={availability.status === 'out_of_stock'}
            className="px-5 py-2.5 text-caption font-medium min-h-[42px]"
          >
            {addedToCart ? 'Added' : availability.status === 'out_of_stock' ? 'Sold Out' : 'Add to Bag'}
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
}