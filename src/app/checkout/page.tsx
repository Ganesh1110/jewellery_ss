import { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { fetchShop } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'Checkout',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CheckoutPage() {
  const shop = await fetchShop();
  const freeShipping = shop.freeShippingThreshold || '₹15,000';
  const returnWindow = shop.returnWindow || '14 days';

  return (
    <div className="min-h-[70vh] flex items-center justify-center section">
      <div className="container max-w-xl text-center">
        <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-8 w-8 text-neutral-950" aria-hidden="true" />
        </div>

        <h1 className="font-heading text-display-md text-neutral-950 mb-3">
          Checkout Ready
        </h1>

        <p className="text-body-lg text-neutral-600 mb-8 max-w-md mx-auto">
          Online checkout is operating in concierge mode for this preview. Our advisors are available to finalize your order with bespoke packaging.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link href="/contact" className="btn-primary">
            Speak to a Consultant
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
            Complimentary shipping over {freeShipping}
          </li>
          <li className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            {returnWindow.includes('day') || returnWindow.includes('month') ? `${returnWindow} returns` : `${returnWindow}-day returns`}
          </li>
        </ul>
      </div>
    </div>
  );
}