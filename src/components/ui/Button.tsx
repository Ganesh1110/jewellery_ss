'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/25 disabled:opacity-30 disabled:pointer-events-none rounded-md active:scale-[0.99]';

    const variantClasses = {
      primary: 'bg-neutral-950 !text-cream-50 hover:bg-neutral-800',
      secondary: 'bg-transparent !text-neutral-950 border border-neutral-950/20 hover:border-neutral-950 hover:bg-neutral-950 hover:!text-cream-50',
      ghost: 'bg-transparent text-neutral-800 hover:bg-neutral-900/[0.04] active:bg-neutral-900/[0.08]',
      link: 'bg-transparent px-0 text-neutral-800 hover:text-neutral-950 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-950 font-normal',
      gold: 'bg-gold-700 !text-cream-50 hover:bg-gold-800',
    };

    const sizeClasses = {
      sm: 'text-caption px-4 py-2 min-h-[40px]',
      md: 'text-body-sm px-6 py-3 min-h-[46px]',
      lg: 'text-body px-7 py-3.5 min-h-[50px]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className="inline-flex items-center gap-2 text-inherit">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };