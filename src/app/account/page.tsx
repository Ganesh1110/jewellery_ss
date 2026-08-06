import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Lock, Package, Heart, Settings } from 'lucide-react';

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

      <section className="section" aria-label="Account sign in">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="card p-6 sm:p-8">
              <h2 className="font-heading text-heading-lg text-neutral-950 mb-2">Sign In</h2>
              <p className="text-body-sm text-neutral-600 mb-6">
                Customer accounts are managed securely at checkout in the live store. In demo mode, sign in is disabled.
              </p>
              <form className="space-y-5" action="#">
                <div className="space-y-2">
                  <label htmlFor="account-email" className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                    <input id="account-email" type="email" required className="input pl-11" placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="account-password" className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                    <input id="account-password" type="password" required className="input pl-11" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full">Sign In</button>
              </form>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Package, label: 'Orders' },
                { icon: Heart, label: 'Wishlist' },
                { icon: Settings, label: 'Settings' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="card p-5 flex flex-col items-center gap-3 text-center">
                  <Icon className="h-6 w-6 text-gold-600" aria-hidden="true" />
                  <span className="text-body-sm font-medium text-neutral-950">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}