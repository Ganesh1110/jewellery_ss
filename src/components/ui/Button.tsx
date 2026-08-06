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
      'inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-wide transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none rounded-md shadow-subtle';

    const variantClasses = {
      primary: 'bg-neutral-950 !text-white hover:bg-neutral-800 active:bg-neutral-900',
      secondary: 'bg-white !text-neutral-950 border-2 border-neutral-950 hover:bg-neutral-950 hover:!text-white',
      ghost: 'bg-transparent text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200',
      link: 'bg-transparent text-neutral-800 hover:text-gold-600 px-2 underline-offset-4 hover:underline font-normal',
      gold: 'bg-gold-500 !text-white hover:bg-gold-600 active:bg-gold-700',
    };

    const sizeClasses = {
      sm: 'text-caption px-4 py-2 min-h-[40px]',
      md: 'text-body-sm px-6 py-3.5 min-h-[48px]',
      lg: 'text-body px-8 py-4 min-h-[54px]',
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