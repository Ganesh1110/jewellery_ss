import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { CheckoutCapture } from '@/components/cart/CheckoutCapture';

export const metadata: Metadata = {
  title: 'Checkout',
};

export default function CheckoutPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <CheckoutCapture />
      <div className="w-full max-w-lg text-center">
        <span className="eyebrow mb-6">Secure Checkout</span>
        <h1 className="font-heading text-display-md tracking-tight text-neutral-950 mb-5">
          Your bag is handled by Shopify
        </h1>
        <p className="text-body text-neutral-600 mb-10 leading-relaxed">
          In the live store, your bag is carried to checkout and the order is stored in the database. Payment is captured as Cash on Delivery.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link href="/collections" className="btn-primary">
            Continue Shopping
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>

        <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-caption text-neutral-500">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            Encrypted payment
          </li>
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            Complimentary shipping over ₹15,000
          </li>
          <li className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            14-day returns
          </li>
        </ul>
      </div>
    </div>
  );
}