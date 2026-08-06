import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Checkout',
};

export default function CheckoutPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-display-sm tracking-tight text-neutral-950 mb-4">
          Checkout is handled by Shopify
        </h1>
        <p className="text-body text-neutral-600 mb-8">
          In the live store, your bag is taken securely to Shopify Checkout. In this demo, the cart works locally in your browser — connect your Storefront credentials to go live.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/collections" className="btn-primary">Continue Shopping</Link>
          <Link href="/" className="btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}