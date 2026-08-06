'use client';

import { useState, useCallback, useEffect } from 'react';
import { OptimizedImage } from '@/components/ui/Image';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types/shopify';

interface ProductGalleryProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  selectedOptions: Record<string, string>;
  onOptionChange: (optionName: string, value: string) => void;
  className?: string;
}

export function ProductGallery({ product, selectedVariant, className }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  // Hover lens zoom position on main image
  const [hoverZoom, setHoverZoom] = useState({ active: false, x: 50, y: 50 });

  // Lightbox zoom level (1 = normal, 2 = 2x, 3 = 3x)
  const [zoomScale, setZoomScale] = useState(1);

  const images = product.images.edges.map(({ node }) => node);
  const variantImage = selectedVariant?.image;
  
  // Determine display images - variant image first if available
  const displayImages = variantImage && variantImage.url
    ? [variantImage, ...images.filter((img) => img.url !== variantImage.url)]
    : images;

  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setHoverZoom({ active: true, x, y });
  };

  const handleMouseLeave = () => {
    setHoverZoom({ active: false, x: 50, y: 50 });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
      setZoomScale(1);
    } else if (e.key === 'ArrowRight') {
      setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
      setZoomScale(1);
    } else if (e.key === 'Escape') {
      setLightboxOpen(false);
      setZoomScale(1);
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

  const currentImage = displayImages[activeIndex] || displayImages[0];

  const zoomIn = () => setZoomScale((prev) => Math.min(prev + 0.5, 3));
  const zoomOut = () => setZoomScale((prev) => Math.max(prev - 0.5, 1));
  const resetZoom = () => setZoomScale(1);

  return (
    <div className={cn('relative', className)}>
      {/* Main Image Container with In-Place Hover Zoom */}
      <div
        className="relative aspect-4-5 overflow-hidden bg-cream-50 cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setLightboxOpen(true)}
      >
        <div
          className="w-full h-full transition-transform duration-200 ease-out"
          style={{
            transformOrigin: `${hoverZoom.x}% ${hoverZoom.y}%`,
            transform: hoverZoom.active ? 'scale(1.8)' : 'scale(1)',
          }}
        >
          <OptimizedImage
            src={currentImage?.url}
            alt={currentImage?.altText || product.title}
            fill
            priority={activeIndex === 0}
            objectFit="cover"
          />
        </div>

        {/* Hover Hint */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none bg-neutral-950/70 text-cream-50 text-caption px-3 py-1.5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Click for full screen view
        </div>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-cream-50/90 backdrop-blur-md text-neutral-800 hover:text-neutral-950 transition-colors opacity-0 group-hover:opacity-100 z-20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-cream-50/90 backdrop-blur-md text-neutral-800 hover:text-neutral-950 transition-colors opacity-0 group-hover:opacity-100 z-20"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {displayImages.length > 1 && (
        <div
          className="flex gap-3 mt-4 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {displayImages.map((image, index) => (
            <button
              key={image.url}
              onClick={() => handleThumbnailClick(index)}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View image ${index + 1}`}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 overflow-hidden transition-all duration-200',
                index === activeIndex ? 'ring-2 ring-neutral-950' : 'opacity-60 hover:opacity-100'
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

      {/* FULL SCREEN LIGHTBOX MODAL (Z-INDEX 100 OVERRIDE) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-neutral-950/95 backdrop-blur-lg flex flex-col justify-between p-4 sm:p-8 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image view"
          onClick={() => { setLightboxOpen(false); setZoomScale(1); }}
        >
          {/* Top Control Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-2 w-full z-[110] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-cream-50 text-caption sm:text-body-sm font-medium tracking-wide bg-neutral-900/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-neutral-800">
              {activeIndex + 1} / {displayImages.length}
            </div>

            {/* Lightbox Zoom Controls & Close Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={zoomIn}
                disabled={zoomScale >= 3}
                className="p-2 sm:p-3 bg-neutral-900/90 text-cream-50 hover:bg-gold-500 hover:text-white rounded-full border border-neutral-700 shadow-strong transition-all disabled:opacity-30"
                aria-label="Zoom in"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={zoomOut}
                disabled={zoomScale <= 1}
                className="p-2 sm:p-3 bg-neutral-900/90 text-cream-50 hover:bg-gold-500 hover:text-white rounded-full border border-neutral-700 shadow-strong transition-all disabled:opacity-30"
                aria-label="Zoom out"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              {zoomScale > 1 && (
                <button
                  onClick={resetZoom}
                  className="p-2 sm:p-3 bg-neutral-900/90 text-cream-50 hover:bg-gold-500 hover:text-white rounded-full border border-neutral-700 shadow-strong transition-all"
                  aria-label="Reset zoom"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
              {/* High visibility Close Button */}
              <button
                onClick={() => { setLightboxOpen(false); setZoomScale(1); }}
                className="p-2 sm:p-3 bg-gold-500 text-white hover:bg-gold-600 rounded-full shadow-strong transition-transform hover:scale-105 ml-1 sm:ml-2 flex items-center gap-1.5 px-3 sm:px-4 font-sans font-medium text-body-sm"
                aria-label="Close zoom modal"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Main Zoomed Image Container */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden py-4 my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Arrow */}
            {displayImages.length > 1 && (
              <button
                onClick={() => {
                  setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
                  setZoomScale(1);
                }}
                className="absolute left-2 sm:left-4 z-[110] p-2 sm:p-4 bg-neutral-900/80 text-cream-50 hover:text-white hover:bg-gold-500 rounded-full border border-neutral-700 shadow-strong transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" />
              </button>
            )}

            {/* Click to Zoom Image View */}
            <div
              className="relative max-w-5xl max-h-[80vh] w-full h-full flex items-center justify-center transition-transform duration-300 ease-out cursor-pointer"
              style={{ transform: `scale(${zoomScale})` }}
              onClick={() => setZoomScale((prev) => (prev === 1 ? 2 : 1))}
            >
              <OptimizedImage
                src={currentImage?.url}
                alt={currentImage?.altText || product.title}
                width={1400}
                height={1750}
                objectFit="contain"
              />
            </div>

            {/* Next Arrow */}
            {displayImages.length > 1 && (
              <button
                onClick={() => {
                  setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
                  setZoomScale(1);
                }}
                className="absolute right-2 sm:right-4 z-[110] p-2 sm:p-4 bg-neutral-900/80 text-cream-50 hover:text-white hover:bg-gold-500 rounded-full border border-neutral-700 shadow-strong transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          {displayImages.length > 1 && (
            <div
              className="flex justify-center gap-2 sm:gap-3 z-[110] relative pt-2 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {displayImages.map((image, index) => (
                <button
                  key={image.url}
                  onClick={() => { setActiveIndex(index); setZoomScale(1); }}
                  className={cn(
                    'w-10 h-10 sm:w-14 sm:h-14 rounded-md overflow-hidden border-2 transition-all flex-shrink-0',
                    index === activeIndex
                      ? 'border-gold-500 scale-105 shadow-strong'
                      : 'border-neutral-800 opacity-60 hover:opacity-100'
                  )}
                  aria-label={`View image ${index + 1}`}
                >
                  <OptimizedImage src={image.url} alt="" fill objectFit="cover" />
                </button>
              ))}
            </div>
          )}
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
          <legend className="text-caption font-medium uppercase tracking-[0.16em] text-neutral-700">
            {option.name}
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={option.name}>
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
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
                    'px-4 py-2 text-body-sm font-medium border transition-colors duration-200',
                    isSelected
                      ? 'border-neutral-950 bg-neutral-950 text-cream-50'
                      : isAvailable
                      ? 'border-neutral-950/20 text-neutral-950 hover:border-neutral-950'
                      : 'border-neutral-950/10 text-neutral-400 cursor-not-allowed line-through'
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
      <label htmlFor="quantity" className="text-caption font-medium uppercase tracking-[0.16em] text-neutral-700 whitespace-nowrap">
        Quantity
      </label>
      <div className="flex items-center border border-neutral-950/20">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1 || disabled}
          className="p-3 text-neutral-700 hover:text-neutral-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Decrease quantity"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
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
          className="w-16 text-center text-body font-medium text-neutral-950 border-x border-neutral-950/20 bg-transparent focus:outline-none focus:ring-0 tabular-nums"
          aria-label="Quantity"
          disabled={disabled}
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max || disabled}
          className="p-3 text-neutral-700 hover:text-neutral-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Increase quantity"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
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