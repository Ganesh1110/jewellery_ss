'use client';

import { forwardRef, ImgHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      priority = false,
      fill = false,
      sizes,
      className,
      placeholder = 'empty',
      blurDataURL,
      objectFit = 'cover',
      objectPosition = 'center',
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);

    // Generate blur data URL if not provided
    const blurUrl = blurDataURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"%3E%3Crect fill="%23e5e5e5" width="10" height="10"/%3E%3C/svg%3E';

    const handleLoad = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      // Fallback to placeholder
      if (currentSrc !== '/placeholder.svg') {
        setCurrentSrc('/placeholder.svg');
      }
    };

    // For fill images, we use absolute positioning
    const imageStyles: React.CSSProperties = {
      objectFit,
      objectPosition,
      transition: 'opacity 0.3s ease-out',
      opacity: isLoading || hasError ? 0 : 1,
    };

    if (fill) {
      imageStyles.position = 'absolute';
      imageStyles.inset = '0';
      imageStyles.width = '100%';
      imageStyles.height = '100%';
    } else if (width && height) {
      imageStyles.width = width;
      imageStyles.height = height;
    }

    const placeholderStyles: React.CSSProperties = {
      position: 'absolute',
      inset: '0',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundImage: `url(${blurUrl})`,
      opacity: isLoading ? 1 : 0,
      transition: 'opacity 0.3s ease-out',
      filter: 'blur(20px)',
      transform: 'scale(1.1)',
    };

    if (!src) {
      return (
        <div
          className={cn('relative bg-neutral-100 overflow-hidden', className)}
          style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
          aria-hidden="true"
        >
          <div style={placeholderStyles} aria-hidden="true" />
        </div>
      );
    }

    return (
      <div
        className={cn('relative overflow-hidden', fill && 'absolute inset-0', className)}
        style={{ width: fill ? undefined : width, height: fill ? undefined : height }}
        role={alt ? 'img' : undefined}
        aria-label={alt}
      >
        {placeholder === 'blur' && (
          <div style={placeholderStyles} aria-hidden="true" />
        )}
        <img
          ref={ref}
          src={currentSrc || undefined}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          style={imageStyles}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage };

// Product image with hover swap
export interface ProductImageProps {
  images: Array<{ url: string; altText: string | null }>;
  selectedVariantImage?: { url: string; altText: string | null } | null;
  aspectRatio?: '4:5' | '1:1' | '3:4';
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  images,
  selectedVariantImage,
  aspectRatio = '4:5',
  className,
  priority = false,
}: ProductImageProps) {
  const [hovered, setHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = selectedVariantImage
    ? [selectedVariantImage, ...images.filter((img) => img.url !== selectedVariantImage?.url)]
    : images;

  const primaryImage = displayImages[0];
  const hoverImage = displayImages[1] || displayImages[0];

  const aspectClasses = {
    '4:5': 'aspect-4-5',
    '1:1': 'aspect-1-1',
    '3:4': 'aspect-3-4',
  };

  return (
    <div
      className={cn('relative overflow-hidden bg-neutral-50', aspectClasses[aspectRatio], className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <OptimizedImage
        src={hovered ? hoverImage.url : primaryImage.url}
        alt={hovered ? hoverImage.altText || '' : primaryImage.altText || ''}
        fill
        priority={priority}
        placeholder="blur"
        className="transition-opacity duration-500 ease-out-expo"
      />
      
      {displayImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100" role="tablist" aria-label="Product images">
          {displayImages.slice(0, 5).map((image, index) => (
            <button
              key={image.url}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`View image ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'bg-neutral-950 w-3'
                  : 'bg-neutral-400 hover:bg-neutral-600'
              )}
            />
          ))}
        </div>
      )}

      {displayImages.length > 5 && (
        <span className="absolute bottom-3 right-3 text-caption bg-neutral-950/80 text-cream-50 px-2 py-1 rounded">
          +{displayImages.length - 5}
        </span>
      )}
    </div>
  );
}