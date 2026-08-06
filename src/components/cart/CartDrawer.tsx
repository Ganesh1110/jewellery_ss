'use client';

import { useEffect, useCallback } from 'react';
import { X, Plus, Minus, Gift, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { OptimizedImage } from '@/components/ui/Image';
import { formatMoney, cn } from '@/lib/utils';
import type { CartLine } from '@/types/shopify';

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeLine, updateNote, isLoading } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isCartOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const lines = cart?.lines.edges.map(({ node }) => node) || [];
  const subtotal = cart?.cost.subtotalAmount.amount || 0;
  const currencyCode = cart?.cost.subtotalAmount.currencyCode || 'USD';
  const total = cart?.cost.totalAmount.amount || 0;
  const note = cart?.note || '';

  const handleQuantityChange = (line: CartLine, delta: number) => {
    const newQuantity = line.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(line.id, line.merchandise.id, newQuantity);
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNote(e.target.value);
  };

  const isEmpty = lines.length === 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-neutral-950/50 animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-cream-50 border-l border-neutral-950/10 animate-slide-in flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-950/10">
          <h2 className="font-heading text-heading-lg tracking-tight text-neutral-950">Shopping Bag</h2>
          <button
            onClick={closeCart}
            className="p-1 text-neutral-500 hover:text-neutral-950 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <h3 className="font-heading text-heading-md text-neutral-950 mb-2">Your bag is empty</h3>
              <p className="text-body text-neutral-500 mb-6 max-w-xs">
                Explore our collections to find a piece worth keeping.
              </p>
              <Button onClick={closeCart} className="w-full sm:w-auto">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ul className="space-y-8" role="list" aria-label="Cart items">
                {lines.map((line) => (
                  <CartItem
                    key={line.id}
                    line={line}
                    currencyCode={currencyCode}
                    onQuantityChange={handleQuantityChange}
                    onRemove={removeLine}
                  />
                ))}
              </ul>

              {/* Gift Note */}
              <div className="mt-8 pt-6 border-t border-neutral-950/10">
                <label htmlFor="cart-note" className="flex items-center gap-2 text-body-sm font-medium text-neutral-700 mb-3">
                  <Gift className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  Gift note (optional)
                </label>
                <textarea
                  id="cart-note"
                  value={note}
                  onChange={handleNoteChange}
                  rows={3}
                  className="input min-h-[80px] resize-y"
                  placeholder="Add a message for the recipient…"
                  aria-describedby="note-help"
                />
                <p id="note-help" className="mt-1.5 text-caption text-neutral-500">
                  Included on a complimentary card with the order.
                </p>
              </div>

              {/* Free Shipping Progress */}
              <FreeShippingProgress subtotal={subtotal} currencyCode={currencyCode} />
            </>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-neutral-950/10 p-4 sm:p-6 space-y-4">
            <div className="flex justify-between text-body">
              <span className="text-neutral-700">Subtotal</span>
              <span className="font-medium text-neutral-950 tabular-nums">
                {formatMoney(subtotal, currencyCode)}
              </span>
            </div>
            <div className="flex justify-between text-body-sm text-neutral-500">
              <span>Shipping & taxes calculated at checkout</span>
            </div>
            <div className="divider" />
            <div className="flex justify-between text-heading-sm font-medium">
              <span className="text-neutral-950">Total</span>
              <span className="text-neutral-950 tabular-nums">{formatMoney(total, currencyCode)}</span>
            </div>

            <Button
              onClick={() => window.location.href = cart?.checkoutUrl || '/checkout'}
              variant="gold"
              className="w-full"
              size="lg"
              disabled={isLoading}
              loading={isLoading}
            >
              Proceed to Checkout
            </Button>

            <Button
              onClick={closeCart}
              variant="secondary"
              className="w-full"
            >
              Continue Shopping
            </Button>

            <p className="text-center text-caption text-neutral-500">
              Secure checkout powered by Shopify
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

interface CartItemProps {
  line: CartLine;
  currencyCode: string;
  onQuantityChange: (line: CartLine, delta: number) => void;
  onRemove: (lineId: string) => void;
}

function CartItem({ line, currencyCode, onQuantityChange, onRemove }: CartItemProps) {
  const { merchandise, quantity, cost, attributes } = line;
  const { title, selectedOptions, image, price, compareAtPrice } = merchandise;
  const lineTotal = cost.totalAmount.amount;

  const hasGiftWrap = attributes?.some((attr) => attr.key === 'Gift Wrap');

  return (
    <li className="flex gap-4">
      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-cream-100">
        <OptimizedImage
          src={image?.url}
          alt={image?.altText || title}
          fill
          objectFit="cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-heading text-body font-medium text-neutral-950 truncate">
            {title}
          </h3>

          {selectedOptions.length > 0 && (
            <p className="mt-1 text-body-sm text-neutral-500">
              {selectedOptions.map((opt) => opt.value).join(' / ')}
            </p>
          )}

          {hasGiftWrap && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-caption text-neutral-500">
              <Gift className="h-3 w-3" aria-hidden="true" />
              Gift wrapped
            </span>
          )}

          <div className="mt-2 flex items-center gap-3">
            <span className="price tabular-nums">{formatMoney(lineTotal, currencyCode)}</span>
            {compareAtPrice && compareAtPrice.amount > price.amount && (
              <span className="price-compare tabular-nums">
                {formatMoney(compareAtPrice.amount, currencyCode)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-950/10 mt-3">
          <QuantitySelector
            quantity={quantity}
            onChange={onQuantityChange}
            line={line}
          />
          <button
            onClick={() => onRemove(line.id)}
            className="text-body-sm text-neutral-400 hover:text-neutral-950 transition-colors"
            aria-label={`Remove ${title}`}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

interface QuantitySelectorProps {
  quantity: number;
  onChange: (line: CartLine, delta: number) => void;
  line: CartLine;
}

function QuantitySelector({ quantity, onChange, line }: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-neutral-950/20">
      <button
        onClick={() => onChange(line, -1)}
        disabled={quantity <= 1}
        className="p-2 text-neutral-700 hover:text-neutral-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="px-3 text-body font-medium text-neutral-950 tabular-nums w-8 text-center">
        {quantity}
      </span>
      <button
        onClick={() => onChange(line, 1)}
        className="p-2 text-neutral-700 hover:text-neutral-950 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

interface FreeShippingProgressProps {
  subtotal: number;
  currencyCode: string;
}

function FreeShippingProgress({ subtotal, currencyCode }: FreeShippingProgressProps) {
  const FREE_SHIPPING_THRESHOLD = 15000; // ₹15,000
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="mt-8 pt-6 border-t border-neutral-950/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          <span className="text-body-sm font-medium text-neutral-700">
            {progress >= 100 ? 'Complimentary shipping unlocked' : 'Complimentary shipping unlocked at ₹15,000'}
          </span>
        </div>
        {progress < 100 && (
          <span className="text-body-sm font-medium text-neutral-950 tabular-nums">
            {formatMoney(remaining, currencyCode)} to go
          </span>
        )}
      </div>
      <div className="h-px bg-neutral-950/10 overflow-hidden">
        <div
          className="h-full bg-neutral-950 transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Free shipping progress"
        />
      </div>
    </div>
  );
}