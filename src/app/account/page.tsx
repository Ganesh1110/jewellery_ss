import { Metadata } from 'next';
import Link from 'next/link';
import { AccountPortal } from '@/components/account/AccountPortal';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Sign in to your Style Statement by Shakthi account to manage orders, wishlist, and preferences.',
};

export default function AccountPage() {
  return (
    <div className="flex flex-col">
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">Account</span>
          </nav>
          <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-4">My Account</h1>
          <p className="text-body-lg text-neutral-600 max-w-2xl">
            Track orders, manage your wishlist, and update your preferences.
          </p>
        </div>
      </header>

      <section className="section" aria-label="Account management portal">
        <div className="container">
          <AccountPortal />
        </div>
      </section>
    </div>
  );
}