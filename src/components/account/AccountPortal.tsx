'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Package, Heart, Settings, User, UserPlus, LogOut, CheckCircle2, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { cn, formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { OptimizedImage } from '@/components/ui/Image';

type Tab = 'account' | 'orders' | 'wishlist' | 'settings';
type AuthMode = 'signin' | 'signup';

interface Customer {
  id: number;
  name: string;
  email: string;
}

export function AccountPortal() {
  const { wishlist, removeFromWishlist, wishlistCount } = useWishlist();
  const { addToCart, openCart } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check active session on mount
  useEffect(() => {
    fetch('/api/auth/customer/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/customer/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');

      setCustomer(data.customer);
      showToast(`Welcome back, ${data.customer.name}!`, 'success');
      setPassword('');
      setActiveTab('orders');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setCustomer(data.customer);
      showToast(`Account created successfully! Welcome, ${data.customer.name}.`, 'success');
      setName('');
      setPassword('');
      setActiveTab('orders');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/customer/logout', { method: 'POST' });
    setCustomer(null);
    setEmail('');
    setPassword('');
    setName('');
    showToast('Signed out of your account', 'info');
    setActiveTab('account');
    setAuthMode('signin');
  };

  if (checkingSession) {
    return (
      <div className="py-12 text-center text-neutral-500 font-medium">
        Loading account details...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Navigation tabs */}
      <div className="border-b border-neutral-950/10 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Account tabs">
        <div className="flex min-w-max sm:min-w-0">
          <button
            role="tab"
            aria-selected={activeTab === 'account'}
            onClick={() => setActiveTab('account')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-body-sm font-medium border-b transition-colors',
              activeTab === 'account'
                ? 'border-neutral-950 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-950'
            )}
          >
            <User className="h-4 w-4" />
            {customer ? 'Profile' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-body-sm font-medium border-b transition-colors',
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
              'flex items-center gap-2 px-4 py-3 text-body-sm font-medium border-b transition-colors',
              activeTab === 'wishlist'
                ? 'border-neutral-950 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-950'
            )}
          >
            <Heart className="h-4 w-4 text-red-500" />
            Wishlist {wishlistCount > 0 && <span className="badge-gold text-[10px] ml-1">({wishlistCount})</span>}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-body-sm font-medium border-b transition-colors',
              activeTab === 'settings'
                ? 'border-neutral-950 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-950'
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="card p-6 sm:p-8">
        {activeTab === 'account' && (
          <div>
            {customer ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-cream-100 rounded-lg border border-neutral-950/10">
                  <div className="w-14 h-14 rounded-full bg-neutral-950 text-cream-50 flex items-center justify-center font-heading text-heading-md font-semibold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-heading text-heading-md text-neutral-950">{customer.name}</h3>
                    <p className="text-body-sm text-neutral-600">{customer.email}</p>
                    <span className="badge-gold text-[10px] mt-1 inline-block">Verified Client</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="p-4 rounded-lg border border-neutral-950/10 hover:border-neutral-950 text-left transition-colors bg-white flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-neutral-950">Track Orders</p>
                      <p className="text-caption text-neutral-500">View recent shipments & receipts</p>
                    </div>
                    <Package className="h-5 w-5 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className="p-4 rounded-lg border border-neutral-950/10 hover:border-neutral-950 text-left transition-colors bg-white flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-neutral-950">Saved Wishlist ({wishlistCount})</p>
                      <p className="text-caption text-neutral-500">View favorite jewelry pieces</p>
                    </div>
                    <Heart className="h-5 w-5 text-red-500" />
                  </button>
                </div>

                <div className="pt-4 border-t border-neutral-950/10 flex justify-end">
                  <Button variant="secondary" onClick={handleSignOut} className="inline-flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 w-full">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setError(null); }}
                    className={cn(
                      'flex-1 py-2 text-body-sm font-medium rounded-md transition-all text-center',
                      authMode === 'signin' ? 'bg-neutral-950 text-cream-50 shadow-subtle' : 'text-neutral-600 hover:text-neutral-950'
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setError(null); }}
                    className={cn(
                      'flex-1 py-2 text-body-sm font-medium rounded-md transition-all text-center',
                      authMode === 'signup' ? 'bg-neutral-950 text-cream-50 shadow-subtle' : 'text-neutral-600 hover:text-neutral-950'
                    )}
                  >
                    Create Account
                  </button>
                </div>

                {error && (
                  <div className="p-3.5 bg-red-50 text-red-800 text-body-sm rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                {authMode === 'signin' ? (
                  <div>
                    <h2 className="font-heading text-heading-lg text-neutral-950 mb-1">Sign In to Your Account</h2>
                    <p className="text-body-sm text-neutral-600 mb-6">
                      Access your orders, saved wishlist items, and delivery preferences.
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
                      <Button type="submit" loading={loading} className="w-full">
                        Sign In
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h2 className="font-heading text-heading-lg text-neutral-950 mb-1">Create a New Client Account</h2>
                    <p className="text-body-sm text-neutral-600 mb-6">
                      Join Style Statement by Shakthi to track purchases and save favorite jewelry.
                    </p>
                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="signup-name" className="label">Full Name</label>
                        <div className="relative">
                          <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                          <input
                            id="signup-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input pl-11"
                            placeholder="Shakthi Atelier"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-email" className="label">Email address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                          <input
                            id="signup-email"
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
                        <label htmlFor="signup-password" className="label">Password (min. 6 characters)</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                          <input
                            id="signup-password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input pl-11"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <Button type="submit" loading={loading} className="w-full">
                        Create Account
                      </Button>
                    </form>
                  </div>
                )}
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
          <div>
            {wishlist.length === 0 ? (
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
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-950/10 pb-3">
                  <h3 className="font-heading text-heading-md text-neutral-950">
                    Saved Items ({wishlist.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((product) => {
                    const firstVariant = product.variants.edges[0]?.node;
                    const price = firstVariant?.price.amount || product.priceRange.minVariantPrice.amount;
                    const currencyCode = firstVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode;
                    const image = product.featuredImage?.url || '/placeholder.svg';

                    return (
                      <div key={product.id} className="card p-4 flex gap-4 items-center bg-white border border-neutral-950/10 rounded-lg">
                        <div className="w-20 h-20 rounded bg-neutral-100 overflow-hidden flex-shrink-0 relative border border-neutral-950/10">
                          <OptimizedImage src={image} alt={product.title} fill objectFit="cover" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-heading font-medium text-neutral-950 text-body-sm line-clamp-1">{product.title}</p>
                          <p className="text-body-sm font-semibold text-neutral-900">{formatMoney(price, currencyCode)}</p>
                          <div className="flex items-center gap-2 pt-1">
                            {firstVariant?.id && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await addToCart(firstVariant.id, 1);
                                  showToast(`Added "${product.title}" to bag`, 'success');
                                  openCart();
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-950 text-cream-50 text-caption rounded font-medium hover:bg-neutral-800 transition-colors"
                              >
                                <ShoppingBag className="h-3 w-3" /> Add to Bag
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFromWishlist(product.id)}
                              className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
