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
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Gallery */}
            <div className="sticky top-24 lg:top-32">
              <ProductGallery
                product={product}
                selectedVariant={selectedVariant}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
              />

              {/* Product Badges */}
              <div className="mt-6 flex flex-wrap gap-2" aria-label="Product features">
                <span className="badge-neutral flex items-center gap-1.5">
                  <Shield className="h-3 w-3" aria-hidden="true" />
                  Certified Authentic
                </span>
                <span className="badge-neutral flex items-center gap-1.5">
                  <Truck className="h-3 w-3" aria-hidden="true" />
                  Free Shipping ₹15K+
                </span>
                <span className="badge-neutral flex items-center gap-1.5">
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  14-Day Returns
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category */}
              {product.productType && (
                <p className="overline text-gold-600">{product.productType}</p>
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
                {onSale && compareAtPrice && (
                  <span className="badge-gold">
                    −{Math.round((1 - price / compareAtPrice!) * 100)}%
                  </span>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 text-body-sm">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  availability.status === 'in_stock' && 'bg-green-500',
                  availability.status === 'low_stock' && 'bg-amber-500',
                  availability.status === 'out_of_stock' && 'bg-neutral-400'
                )} aria-hidden="true" />
                <span className={cn(
                  availability.status === 'in_stock' && 'text-green-700',
                  availability.status === 'low_stock' && 'text-amber-700',
                  availability.status === 'out_of_stock' && 'text-neutral-500'
                )}>
                  {availability.message}
                </span>
              </div>

              {/* Description */}
              <div className="prose prose-neutral max-w-none">
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
              <div className="flex flex-col sm:flex-row gap-4 items-start pt-4 border-t border-neutral-200">
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
                    className="w-full sm:w-auto"
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
              <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
                <button className="btn-ghost p-2" aria-label="Add to wishlist">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="btn-ghost p-2" aria-label="Share product">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Trust Signals */}
              <div className="pt-6 border-t border-neutral-200 space-y-4">
                {[
                  { icon: Shield, title: 'Certified Authentic', desc: 'All gemstones certified by IGI/GIA' },
                  { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₹15,000 worldwide' },
                  { icon: RotateCcw, title: 'Easy Returns', desc: '14-day hassle-free return policy' },
                ].map((signal) => (
                  <div key={signal.title} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <signal.icon className="h-5 w-5 text-neutral-700" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-950">{signal.title}</p>
                      <p className="text-body-sm text-neutral-600">{signal.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* You May Also Like */}
      {recommendations.length > 0 && (
        <section className="section bg-white border-y border-neutral-200" aria-labelledby="recommendations-heading">
          <div className="container">
            <header className="max-w-2xl mx-auto text-center mb-12">
              <h2 id="recommendations-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-4">
                You May Also Like
              </h2>
              <p className="text-body-lg text-neutral-600">
                Handpicked pieces that complement your selection.
              </p>
            </header>
            <ProductGrid products={recommendations} columns={4} />
          </div>
        </section>
      )}
    </div>
  );
}