'use client';

import { forwardRef, useState } from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps {
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
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      className,
      placeholder = 'empty',
      blurDataURL,
      objectFit = 'cover',
      objectPosition = 'center',
    },
    ref
  ) => {
    const [hasError, setHasError] = useState(false);

    const defaultBlurUrl =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"%3E%3Crect fill="%23e5e5e5" width="10" height="10"/%3E%3C/svg%3E';

    const imageSrc = hasError || !src ? '/placeholder.svg' : src;

    if (!src && !hasError) {
      return (
        <div
          className={cn('relative bg-neutral-100 overflow-hidden', className)}
          style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
          aria-hidden="true"
        />
      );
    }

    return (
      <div
        className={cn('relative overflow-hidden', fill && 'absolute inset-0', className)}
        style={{ width: fill ? undefined : width, height: fill ? undefined : height }}
      >
        <NextImage
          ref={ref}
          src={imageSrc}
          alt={alt}
          width={!fill ? width || 800 : undefined}
          height={!fill ? height || 800 : undefined}
          fill={fill}
          priority={priority}
          sizes={sizes}
          unoptimized={hasError || imageSrc.endsWith('.svg')}
          placeholder={placeholder === 'blur' && !hasError ? 'blur' : 'empty'}
          blurDataURL={placeholder === 'blur' && !hasError ? blurDataURL || defaultBlurUrl : undefined}
          onError={() => setHasError(true)}
          style={{
            objectFit,
            objectPosition,
          }}
          className="transition-opacity duration-300"
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
        className="transition-opacity duration-500 ease-out"
      />
    </div>
  );
}