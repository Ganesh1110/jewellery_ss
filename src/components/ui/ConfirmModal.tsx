'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 className="h-6 w-6 text-red-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    info: <HelpCircle className="h-6 w-6 text-gold-600" />,
  };

  const bgMap = {
    danger: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-gold-50 border-gold-100',
  };

  const confirmVariantMap = {
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/30' as const,
    warning: 'gold' as const,
    info: 'primary' as const,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="relative w-full max-w-md rounded-xl bg-white p-6 sm:p-8 shadow-2xl border border-neutral-200/80 z-10 space-y-6 transform transition-all animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full border shrink-0 ${bgMap[variant]}`}>
            {iconMap[variant]}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h3 id="modal-title" className="font-heading text-heading-md text-neutral-950 font-medium leading-snug">
              {title}
            </h3>
            <p id="modal-description" className="text-body-sm text-neutral-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          {variant === 'danger' ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-3 min-h-[46px] rounded-md text-body-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${confirmVariantMap.danger}`}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {confirmText}
            </button>
          ) : (
            <Button
              type="button"
              variant={confirmVariantMap[variant]}
              loading={loading}
              onClick={onConfirm}
              className="w-full sm:w-auto"
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
