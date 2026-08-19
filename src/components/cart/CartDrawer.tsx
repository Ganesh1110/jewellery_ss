'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Minus, Gift, Truck, CheckCircle2, Sparkles, MapPin, UserCheck, Lock } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { OptimizedImage } from '@/components/ui/Image';
import { formatMoney } from '@/lib/utils';
import { checkoutOrder, type CheckoutOrderSuccess } from '@/lib/cart-api';
import type { CartLine } from '@/types/shopify';

interface CartDrawerProps {
  freeShippingThreshold?: string;
}

export function CartDrawer({ freeShippingThreshold = '₹15,000' }: CartDrawerProps = {}) {
  const { cart, isCartOpen, closeCart, updateQuantity, removeLine, updateNote, isLoading } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<CheckoutOrderSuccess['order'] | null>(null);
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);

  // Address details state for guest & logged-in checkout
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [createAccount, setCreateAccount] = useState(false);

  useEffect(() => {
    fetch('/api/auth/customer/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) {
          setCustomer(data.customer);
          if (data.customer.name) setCustomerName(data.customer.name);
          if (data.customer.email) setCustomerEmail(data.customer.email);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNote(e.target.value);
  };

  const handleCheckout = async () => {
    if (!cart) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    const result = await checkoutOrder({
      cartId: cart.id,
      customerName,
      customerEmail,
      customerPhone,
      address: {
        addressLine,
        city,
        state,
        pincode,
      },
      createAccount,
    });
    if (result.ok) {
      setConfirmation(result.order);
    } else {
      setCheckoutError(result.error);
    }
    setIsCheckingOut(false);
  };

  const isEmpty = lines.length === 0;

  const handleQuantityChange = (line: CartLine, delta: number) => {
    const newQuantity = line.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(line.id, line.merchandise.id, newQuantity);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-neutral-950/50 animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-drawer w-full max-w-md bg-cream-50 border-l border-neutral-950/10 animate-slide-in-right flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-950/10">
          <h2 className="font-heading text-heading-lg tracking-tight text-neutral-950">Shopping Bag</h2>
          <button
            onClick={closeCart}
            className="inline-flex h-11 w-11 items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {confirmation ? (
            <div className="flex flex-col h-full min-h-[300px] justify-center text-center" role="status">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-600" aria-hidden="true" />
              <h3 className="font-heading text-heading-md text-neutral-950 mb-2">Order confirmed</h3>
              <p className="text-caption text-neutral-500 mb-1">
                {confirmation.orderNumber} · {confirmation.status}
              </p>
              <p className="text-body text-neutral-600 mb-6 max-w-xs mx-auto">
                Thank you, {confirmation.name || 'your order is in'}. We&apos;ll reach out on delivery
                confirmation. Pay Cash on Delivery.
              </p>
              <div className="flex justify-between text-body-sm text-neutral-700 mb-1">
                <span>Total</span>
                <span className="font-medium text-neutral-950 tabular-nums">
                  {formatMoney(confirmation.total, confirmation.currencyCode)}
                </span>
              </div>
              <ul className="text-caption text-neutral-500 border-t border-neutral-950/10 mt-4 pt-4 space-y-1" role="list">
                {confirmation.lineItems.map((item) => (
                  <li key={item.title} className="flex justify-between gap-3">
                    <span className="truncate">{item.title} × {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={closeCart} variant="secondary" className="w-full mt-6">
                Keep Shopping
              </Button>
            </div>
          ) : isEmpty ? (
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
              {/* Login for Exclusive Offers Alert Banner (Requirement 14) */}
              {!customer && (
                <div className="mb-6 p-4 rounded-xl bg-gold-50 border border-gold-300 text-neutral-900 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-heading text-body font-semibold text-gold-800">
                    <Sparkles className="h-4 w-4 text-gold-700" />
                    Login to unlock exclusive member offers!
                  </div>
                  <p className="text-caption text-neutral-700">
                    Sign in to your account to get 10% off member rewards, special gifts, and faster checkout.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/account"
                      onClick={closeCart}
                      className="inline-flex items-center gap-1.5 text-caption font-semibold text-gold-800 hover:text-gold-900 underline underline-offset-4"
                    >
                      <Lock className="h-3.5 w-3.5" /> Login / Register Now &rarr;
                    </Link>
                  </div>
                </div>
              )}

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

              {/* Shipping Address & Contact Form (Requirement 11 & 12) */}
              <div className="mt-8 pt-6 border-t border-neutral-950/10 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gold-600" />
                  <h3 className="font-heading text-body font-semibold text-neutral-950">Shipping & Client Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                  <div>
                    <label className="label text-[10px]">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input min-h-[42px] py-2 text-body-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-[10px]">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. priya@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="input min-h-[42px] py-2 text-body-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label text-[10px]">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="input min-h-[42px] py-2 text-body-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label text-[10px]">Delivery Street Address</label>
                    <input
                      type="text"
                      placeholder="Flat, House No., Street, Area"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="input min-h-[42px] py-2 text-body-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-[10px]">City</label>
                    <input
                      type="text"
                      placeholder="Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input min-h-[42px] py-2 text-body-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-[10px]">Pincode / ZIP</label>
                    <input
                      type="text"
                      placeholder="400001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="input min-h-[42px] py-2 text-body-sm"
                    />
                  </div>
                </div>

                {!customer && (
                  <div className="flex items-center gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="create-account-checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                    />
                    <label htmlFor="create-account-checkbox" className="text-caption font-medium text-neutral-800 cursor-pointer">
                      Create an account with these details for faster future orders
                    </label>
                  </div>
                )}
              </div>

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
              <FreeShippingProgress subtotal={subtotal} currencyCode={currencyCode} freeShippingThreshold={freeShippingThreshold} />
            </>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && !confirmation && (
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
              onClick={handleCheckout}
              variant="gold"
              className="w-full"
              size="lg"
              disabled={isLoading || isCheckingOut}
              loading={isLoading || isCheckingOut}
            >
              Proceed to Checkout
            </Button>

            {checkoutError && (
              <Alert variant="error" dismissible onClose={() => setCheckoutError(null)}>
                {checkoutError}
              </Alert>
            )}

            <Button
              onClick={closeCart}
              variant="secondary"
              className="w-full"
            >
              Continue Shopping
            </Button>

            <p className="text-center text-caption text-neutral-500">
              Cash on Delivery at checkout
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

        <div className="flex items-center justify-between pt-3 border-t border-neutral-950/10 mt-3 gap-3">
          <QuantitySelector
            quantity={quantity}
            onChange={onQuantityChange}
            line={line}
          />
          <button
            onClick={() => onRemove(line.id)}
            className="inline-flex min-h-[44px] items-center text-body-sm text-neutral-400 hover:text-neutral-950 transition-colors"
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
        className="inline-flex h-11 w-11 items-center justify-center text-neutral-700 hover:text-neutral-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="px-2 text-body font-medium text-neutral-950 tabular-nums w-8 text-center" aria-live="polite">
        {quantity}
      </span>
      <button
        onClick={() => onChange(line, 1)}
        className="inline-flex h-11 w-11 items-center justify-center text-neutral-700 hover:text-neutral-950 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function parseThreshold(threshold?: string): number {
  if (!threshold) return 15000;
  const num = parseInt(threshold.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) || num <= 0 ? 15000 : num;
}

interface FreeShippingProgressProps {
  subtotal: number;
  currencyCode: string;
  freeShippingThreshold?: string;
}

function FreeShippingProgress({ subtotal, currencyCode, freeShippingThreshold = '₹15,000' }: FreeShippingProgressProps) {
  const FREE_SHIPPING_THRESHOLD = parseThreshold(freeShippingThreshold);
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div className="mt-8 pt-6 border-t border-neutral-950/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          <span className="text-body-sm font-medium text-neutral-700">
            {progress >= 100 ? 'Complimentary shipping unlocked' : `Complimentary shipping unlocked at ${freeShippingThreshold}`}
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