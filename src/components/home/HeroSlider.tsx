'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/Image';

export interface HeroSlide {
  src: string;
  alt: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  children?: React.ReactNode;
  interval?: number;
  className?: string;
}

export function HeroSlider({
  slides,
  children,
  interval = 7000,
  className,
}: HeroSliderProps) {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (index: number) => setCurrent(((index % slides.length) + slides.length) % slides.length),
    [slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, slides.length]);

  return (
    <section className={cn('relative flex items-center overflow-hidden', className)}>
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          aria-hidden={index !== current}
          className={cn(
            'absolute inset-0 transition-opacity duration-slower ease-expo',
            index === current ? 'opacity-100' : 'opacity-0'
          )}
        >
          <OptimizedImage
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            className={cn('object-cover scale-105', index === current && 'animate-hero-zoom')}
          />
        </div>
      ))}

      {/* Overlays — soft, editorial */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/70 via-neutral-950/35 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950/40 to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="container relative z-10 py-20 sm:py-36 lg:py-44 text-center sm:text-left">{children}</div>

      {/* Navigation — single quiet control */}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-3 sm:justify-end sm:pr-6 lg:pr-8" role="tablist" aria-label="Hero slides">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 backdrop-blur-md transition-colors hover:bg-cream-50 hover:text-neutral-950"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 px-1">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                role="tab"
                aria-selected={index === current}
                aria-label={`Show slide ${index + 1}`}
                onClick={() => goTo(index)}
                className={cn(
                  'inline-flex h-11 items-center justify-center transition-all duration-300',
                  index === current ? 'w-8' : 'w-1.5'
                )}
              >
                <span className={cn('h-1.5 w-full rounded-full transition-colors', index === current ? 'bg-cream-50' : 'bg-cream-50/40 hover:bg-cream-50/70')} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 backdrop-blur-md transition-colors hover:bg-cream-50 hover:text-neutral-950"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}