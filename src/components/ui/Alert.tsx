'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; title: string }> = {
  success: {
    container: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900',
    icon: 'text-emerald-600',
    title: 'text-emerald-950 font-medium',
  },
  error: {
    container: 'bg-red-50/90 border-red-200/80 text-red-900',
    icon: 'text-red-600',
    title: 'text-red-950 font-medium',
  },
  warning: {
    container: 'bg-amber-50/90 border-amber-200/80 text-amber-900',
    icon: 'text-amber-600',
    title: 'text-amber-950 font-medium',
  },
  info: {
    container: 'bg-neutral-900 text-cream-50 border-neutral-800',
    icon: 'text-gold-400',
    title: 'text-cream-50 font-medium',
  },
};

const variantIcons: Record<AlertVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', title, children, onClose, dismissible = false, className, ...props }, ref) => {
    const style = variantStyles[variant];
    const Icon = variantIcons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4 shadow-sm transition-all duration-200 flex items-start gap-3.5',
          style.container,
          className
        )}
        {...props}
      >
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', style.icon)} aria-hidden="true" />
        <div className="flex-1 min-w-0 text-body-sm space-y-1">
          {title && <h5 className={cn('text-body-sm leading-snug', style.title)}>{title}</h5>}
          {children && <div className="leading-relaxed opacity-90">{children}</div>}
        </div>
        {(dismissible || onClose) && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 -mr-1 -mt-1 rounded-md opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-neutral-950/20"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
