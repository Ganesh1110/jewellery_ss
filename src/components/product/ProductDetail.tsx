'use client';

import { useState, useCallback, useEffect } from 'react';
import { OptimizedImage, ProductImage } from '@/components/ui/Image';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant, Image } from '@/types/shopify';

interface ProductGalleryProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  selectedOptions: Record<string, string>;
  onOptionChange: (optionName: string, value: string) => void;
  className?: string;
}

export function ProductGallery({ product, selectedVariant, selectedOptions, onOptionChange, className }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = product.images.edges.map(({ node }) => node);
  const variantImage = selectedVariant?.image;
  
  // Determine display images - variant image first if available
  const displayImages = variantImage && variantImage.url
    ? [variantImage, ...images.filter((img) => img.url !== variantImage.url)]
    : images;

  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
    } else if (e.key === 'ArrowRight') {
      setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'Escape') {
      setLightboxOpen(false);
    }
  }, [displayImages.length]);

  useEffect(() => {
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, handleKeyDown]);

  // Reset to first image when variant changes
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedVariant?.id]);

  const currentImage = displayImages[activeIndex];

  return (
    <div className={cn('relative', className)}>
      {/* Main Image */}
      <div className="relative aspect-4-5 overflow-hidden bg-neutral-50">
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          aria-label="Zoom image"
        >
          <ProductImage
            images={displayImages}
            selectedVariantImage={variantImage ? { url: variantImage.url, altText: variantImage.altText } : null}
            aspectRatio="4:5"
            priority={activeIndex === 0}
          />
        </button>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-white transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-white transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-neutral-700 opacity-0 group-hover:opacity-100">
          <Expand className="h-4 w-4" />
        </div>
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div
          className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin"
          role="tablist"
          aria-label="Product images"
        >
          {displayImages.map((image, index) => (
            <button
              key={image.url}
              onClick={() => handleThumbnailClick(index)}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View image ${index + 1}`}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all duration-300',
                index === activeIndex
                  ? 'border-gold-500'
                  : 'border-transparent hover:border-neutral-300'
              )}
            >
              <OptimizedImage
                src={image.url}
                alt={image.altText || ''}
                fill
                objectFit="cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-cream-50/70 hover:text-cream-50 transition-colors"
            aria-label="Close zoom"
          >
            <X className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
            className="absolute left-4 p-2 text-cream-50/70 hover:text-cream-50 transition-colors hidden sm:block"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh]">
            <OptimizedImage
              src={currentImage.url}
              alt={currentImage.altText || ''}
              width={1200}
              height={1500}
              objectFit="contain"
            />
          </div>

          <button
            onClick={() => setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
            className="absolute right-4 p-2 text-cream-50/70 hover:text-cream-50 transition-colors hidden sm:block"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Thumbnails in lightbox */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {displayImages.map((image, index) => (
              <button
                key={image.url}
                onClick={() => { setActiveIndex(index); setLightboxOpen(true); }}
                className={cn(
                  'w-16 h-16 rounded overflow-hidden border-2 transition-all',
                  index === activeIndex ? 'border-gold-500' : 'border-transparent hover:border-neutral-600'
                )}
                aria-label={`View image ${index + 1}`}
              >
                <OptimizedImage src={image.url} alt="" fill objectFit="cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface VariantSelectorProps {
  product: Product;
  selectedOptions: Record<string, string>;
  onOptionChange: (optionName: string, value: string) => void;
  disabled?: boolean;
}

export function VariantSelector({ product, selectedOptions, onOptionChange, disabled = false }: VariantSelectorProps) {
  return (
    <div className="space-y-6" role="group" aria-label="Product options">
      {product.options.map((option) => (
        <fieldset key={option.id} className="space-y-3" disabled={disabled}>
          <legend className="text-body-sm font-medium text-neutral-700 uppercase tracking-wider">
            {option.name}
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={option.name}>
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              // Check if this value is available with current other selections
              const isAvailable = product.variants.edges.some(({ node: variant }) => {
                const matches = variant.selectedOptions.every(
                  (opt) => opt.name === option.name ? opt.value === value : selectedOptions[opt.name] === opt.value
                );
                return matches && variant.availableForSale;
              });

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!isAvailable || disabled}
                  onClick={() => !disabled && isAvailable && onOptionChange(option.name, value)}
                  disabled={!isAvailable || disabled}
                  className={cn(
                    'px-4 py-2.5 text-body-sm font-medium rounded border-2 transition-all duration-fast',
                    isSelected
                      ? 'border-neutral-950 bg-neutral-950 text-cream-50'
                      : isAvailable
                      ? 'border-neutral-300 text-neutral-950 hover:border-neutral-950 hover:bg-neutral-50'
                      : 'border-neutral-200 text-neutral-400 cursor-not-allowed line-through'
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({ value, onChange, max = 99, disabled = false }: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label htmlFor="quantity" className="text-body-sm font-medium text-neutral-700 uppercase tracking-wider whitespace-nowrap">
        Quantity
      </label>
      <div className="flex items-center border border-neutral-300 rounded">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1 || disabled}
          className="p-3 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input
          type="number"
          id="quantity"
          value={value}
          onChange={(e) => {
            const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), max);
            onChange(val);
          }}
          min="1"
          max={max}
          className="w-16 text-center text-body font-medium text-neutral-950 border-x border-neutral-300 bg-transparent focus:outline-none focus:ring-0"
          aria-label="Quantity"
          disabled={disabled}
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max || disabled}
          className="p-3 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export interface AddToCartButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function AddToCartButton({ onClick, loading = false, disabled = false, children, className }: AddToCartButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'btn-primary w-full sm:w-auto min-h-[52px] text-body font-medium',
        'flex items-center justify-center gap-2',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children || (loading ? 'Adding...' : 'Add to Bag')}
    </button>
  );
}