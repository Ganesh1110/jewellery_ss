'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Package, Heart, Settings, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type Tab = 'signin' | 'orders' | 'wishlist' | 'settings';

export function AccountPortal() {
  const [activeTab, setActiveTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSignedInEmail(email);
    setIsSignedIn(true);
    setActiveTab('orders');
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setSignedInEmail('');
    setEmail('');
    setPassword('');
    setActiveTab('signin');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Navigation tabs */}
      <div className="flex border-b border-neutral-950/10" role="tablist" aria-label="Account tabs">
        <button
          role="tab"
          aria-selected={activeTab === 'signin'}
          onClick={() => setActiveTab('signin')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-body-sm font-medium border-b transition-colors',
            activeTab === 'signin'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-500 hover:text-neutral-950'
          )}
        >
          <User className="h-4 w-4" />
          {isSignedIn ? 'Account Details' : 'Sign In'}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-body-sm font-medium border-b transition-colors',
            activeTab === 'orders'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-500 hover:text-neutral-950'
          )}
        >
          <Package className="h-4 w-4" />
          Orders
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'wishlist'}
          onClick={() => setActiveTab('wishlist')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-body-sm font-medium border-b transition-colors',
            activeTab === 'wishlist'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-500 hover:text-neutral-950'
          )}
        >
          <Heart className="h-4 w-4" />
          Wishlist
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-body-sm font-medium border-b transition-colors',
            activeTab === 'settings'
              ? 'border-neutral-950 text-neutral-950'
              : 'border-transparent text-neutral-500 hover:text-neutral-950'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {/* Tab Panels */}
      <div className="card p-6 sm:p-8">
        {activeTab === 'signin' && (
          <div>
            {isSignedIn ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-950/[0.06] text-neutral-900 flex items-center justify-center font-medium text-lg">
                    {signedInEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-heading text-heading-md text-neutral-950">Welcome back</h3>
                    <p className="text-body-sm text-neutral-500">{signedInEmail}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-950/10 flex gap-4">
                  <Button variant="secondary" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-heading text-heading-lg text-neutral-950 mb-2">Sign In</h2>
                <p className="text-body-sm text-neutral-600 mb-6">
                  Sign in to view your orders, saved pieces, and delivery addresses.
                </p>
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="account-email" className="label">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                      <input
                        id="account-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input pl-11"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="account-password" className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                      <input
                        id="account-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input pl-11"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="text-center py-8 space-y-4">
            <Package className="h-12 w-12 text-neutral-300 mx-auto" />
            <h3 className="font-heading text-heading-md text-neutral-950">No Orders Found</h3>
            <p className="text-body text-neutral-500 max-w-sm mx-auto">
              When you place an order, its progress and tracking details will appear here.
            </p>
            <Link href="/collections" className="btn-secondary inline-block">
              Explore Collections
            </Link>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="text-center py-8 space-y-4">
            <Heart className="h-12 w-12 text-neutral-300 mx-auto" />
            <h3 className="font-heading text-heading-md text-neutral-950">Your Wishlist is Empty</h3>
            <p className="text-body text-neutral-500 max-w-sm mx-auto">
              Save your favorite pieces while browsing by clicking the heart icon on any product page.
            </p>
            <Link href="/collections" className="btn-secondary inline-block">
              Start Shopping
            </Link>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="font-heading text-heading-md text-neutral-950">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded">
                <div>
                  <p className="text-body font-medium text-neutral-950">Currency</p>
                  <p className="text-caption text-neutral-500">Displayed prices currency</p>
                </div>
                <span className="text-body-sm font-semibold text-neutral-800">INR (₹)</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-950/[0.03] rounded-sm">
                <div>
                  <p className="text-body font-medium text-neutral-950">Marketing Communications</p>
                  <p className="text-caption text-neutral-500">Receive new release updates</p>
                </div>
                <span className="text-caption text-neutral-900 font-medium">Subscribed</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
