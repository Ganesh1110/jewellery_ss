'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastVariantStyles: Record<ToastVariant, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-neutral-950',
    border: 'border-emerald-500/40',
    icon: 'text-emerald-400',
    text: 'text-cream-50',
  },
  error: {
    bg: 'bg-neutral-950',
    border: 'border-red-500/40',
    icon: 'text-red-400',
    text: 'text-cream-50',
  },
  warning: {
    bg: 'bg-neutral-950',
    border: 'border-amber-500/40',
    icon: 'text-amber-400',
    text: 'text-cream-50',
  },
  info: {
    bg: 'bg-neutral-950',
    border: 'border-gold-500/40',
    icon: 'text-gold-400',
    text: 'text-cream-50',
  },
};

const toastIcons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 3500) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: ToastMessage = { id, message, variant, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const style = toastVariantStyles[toast.variant];
          const Icon = toastIcons[toast.variant];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in slide-in-from-bottom-5 ${style.bg} ${style.border} ${style.text}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`h-5 w-5 shrink-0 ${style.icon}`} />
                <p className="text-body-sm font-medium leading-snug">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors shrink-0"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback stub if rendered outside provider so it never crashes
    return {
      showToast: (msg: string) => {
        console.log('[Toast Notification]', msg);
      },
      dismissToast: () => {},
    };
  }
  return context;
}
