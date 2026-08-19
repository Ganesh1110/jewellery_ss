'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Share2, Truck, RotateCcw, Shield, Check } from 'lucide-react';
import { ProductGallery, VariantSelector, QuantitySelector, AddToCartButton } from '@/components/product/ProductDetail';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatMoney, getSelectedVariant, getVariantAvailability, cn } from '@/lib/utils';
import type { Product } from '@/types/shopify';

export function ProductDetailsClient({
  product,
  recommendations,
  freeShippingThreshold = '₹15,000',
  returnWindow = '14 days',
}: {
  product: Product;
  recommendations: Product[];
  freeShippingThreshold?: string;
  returnWindow?: string;
}) {
  const { addToCart, isLoading: cartLoading } = useCart();
  const { showToast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);
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

    try {
      await addToCart(selectedVariant.id, quantity);
      setAddedToCart(true);
      showToast(`Added ${quantity} × "${product.title}" to cart`, 'success');
      setTimeout(() => setAddedToCart(false), 3000);
    } catch {
      showToast('Could not add item to cart', 'error');
    }
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

              {/* Quantity & Add to Cart & WhatsApp Inquiry */}
              <div className="flex flex-col sm:flex-row gap-4 items-start pt-8 border-t border-neutral-950/10">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  max={selectedVariant?.quantityAvailable || 99}
                  disabled={availability.status === 'out_of_stock'}
                />
                <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
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

                  <a
                    href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I am interested in purchasing "${product.title}" (${window.location.href}). Please assist me.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full sm:w-auto min-h-[52px] text-body font-medium flex items-center justify-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    Enquire on WhatsApp
                  </a>
                </div>
              </div>

              {/* Share Action (Wishlist hidden for now) */}
              <div className="flex items-center gap-6 pt-6 border-t border-neutral-950/10">
                <button
                  type="button"
                  onClick={async () => {
                    const shareData = {
                      title: product.title,
                      text: `Check out ${product.title} at Style Statement by Shakthi`,
                      url: window.location.href,
                    };
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      try {
                        await navigator.share(shareData);
                      } catch {}
                    } else {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        showToast('Product link copied to clipboard!', 'success');
                      } catch {
                        showToast('Could not copy link to clipboard', 'error');
                      }
                    }
                  }}
                  className="inline-flex items-center gap-2 text-body-sm font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
                  aria-label="Share product"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share Piece
                </button>
              </div>

              {/* Care & Handling Instructions Accordion (Aarvee Jewel Style) */}
              <div className="border-t border-neutral-950/10 pt-6 space-y-4">
                <details className="group border border-neutral-950/10 rounded-lg p-4 bg-cream-50/50 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between font-heading text-body font-medium text-neutral-950 cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gold-600" />
                      Care & Handling Instructions
                    </span>
                    <span className="transition duration-300 group-open:-rotate-180">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-body-sm text-neutral-600 space-y-2 leading-relaxed pt-2 border-t border-neutral-950/5">
                    <p>&bull; <strong>Avoid Contact with Liquids:</strong> Keep your jewelry away from water, perfumes, hairsprays, lotions, and harsh household chemicals.</p>
                    <p>&bull; <strong>Storage:</strong> Store each piece individually in an airtight pouch or soft velvet box to prevent oxidation and scratches.</p>
                    <p>&bull; <strong>Cleaning:</strong> Gently wipe with a dry, soft lint-free cloth after each wear to restore shine. Never soak gemstone pieces in harsh cleaning solutions.</p>
                    <p>&bull; <strong>Wear Advice:</strong> Put your jewelry on as the final touch after dressing and applying makeup/fragrance, and take off before exercising or sleeping.</p>
                  </div>
                </details>

                <details className="group border border-neutral-950/10 rounded-lg p-4 bg-cream-50/50 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between font-heading text-body font-medium text-neutral-950 cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gold-600" />
                      Shipping & Delivery Details
                    </span>
                    <span className="transition duration-300 group-open:-rotate-180">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-body-sm text-neutral-600 space-y-2 leading-relaxed pt-2 border-t border-neutral-950/5">
                    <p>Complimentary insured shipping on all orders over {freeShippingThreshold}. Delivered in signature tamper-proof luxury packaging within 3 to 7 business days.</p>
                  </div>
                </details>
              </div>

              {/* Service Note */}
              <div className="space-y-3 text-body-sm text-neutral-600 pt-2">
                <p className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  Complimentary shipping on orders over {freeShippingThreshold}
                </p>
                <p className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  {returnWindow.includes('day') || returnWindow.includes('month') ? `${returnWindow} complimentary returns` : `${returnWindow}-day complimentary returns`}
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
            className="px-5 py-2.5 text-caption font-medium min-h-[44px]"
          >
            {addedToCart ? 'Added' : availability.status === 'out_of_stock' ? 'Sold Out' : 'Add to Bag'}
          </AddToCartButton>
        </div>
      </div>

      {/* Mobile spacer so the last section clears the sticky bar */}
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}