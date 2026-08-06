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
            'absolute inset-0 transition-opacity duration-slower ease-out-expo',
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

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/55 to-neutral-950/20" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neutral-950/50 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-950/80 to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="container relative z-10 py-16 sm:py-32 lg:py-40 text-center sm:text-left">{children}</div>

      {/* Navigation */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-6 z-10 pointer-events-none">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous slide"
          className="pointer-events-auto w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-neutral-950/40 text-cream-50 backdrop-blur-md flex items-center justify-center transition-colors hover:bg-gold-500 hover:text-neutral-950"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="pointer-events-auto w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-neutral-950/40 text-cream-50 backdrop-blur-md flex items-center justify-center transition-colors hover:bg-gold-500 hover:text-neutral-950"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2" role="tablist" aria-label="Hero slides">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            role="tab"
            aria-selected={index === current}
            aria-label={`Show slide ${index + 1}`}
            onClick={() => goTo(index)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === current ? 'w-8 bg-gold-400' : 'w-1.5 bg-cream-50/50 hover:bg-cream-50/80'
            )}
          />
        ))}
      </div>
    </section>
  );
}