'use client';

import { forwardRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  ShoppingBag,
  Search,
  User,
  ChevronDown,
} from 'lucide-react';

const navigation = [
  { name: 'Collections', href: '/collections' },
  { name: 'New Arrivals', href: '/collections/new-arrivals' },
  { name: 'Bestsellers', href: '/collections/bestsellers' },
  { name: 'Journal', href: '/journal' },
];

export function Header() {
  const { totalQuantity, openCart, isCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
      setSearchOpen(false);
    }
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-normal ease-out-expo',
        scrolled && 'bg-cream-50/95 backdrop-blur-sm border-b border-neutral-200',
        !scrolled && 'bg-transparent'
      )}
      onKeyDown={handleKeyDown}
      role="banner"
    >
      {/* Announcement Bar */}
      <div className="hidden sm:block bg-neutral-950 text-cream-50 py-2 px-4 text-center text-caption uppercase tracking-widest">
        Complimentary shipping on orders over ₹15,000 &mdash; Returns within 14 days
      </div>

      {/* Main Header */}
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2 -ml-2 text-neutral-700 hover:text-neutral-950"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <div className="flex-1 flex justify-center">
            <Link
              href="/"
              className="font-heading text-display-sm tracking-tight text-neutral-950 hover:opacity-80 transition-opacity"
              aria-label="Style Statement by Shakthi Home"
            >
              <span className="flex items-baseline gap-1.5 font-light">
                <span>Style Statement</span>
                <span className="text-body-xs uppercase tracking-[0.3em] text-neutral-500">by Shakthi</span>
              </span>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Search */}
            <button
              className="p-2 sm:p-0 text-neutral-700 hover:text-neutral-950"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline-flex items-center gap-1.5 text-body-sm font-medium uppercase tracking-wider">
                <Search className="h-4 w-4" />
                Search
              </span>
            </button>

            {/* Account */}
            <Link
              href="/account"
              className="p-2 sm:p-0 text-neutral-700 hover:text-neutral-950"
              aria-label="Account"
            >
              <User className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline text-body-sm font-medium uppercase tracking-wider">Account</span>
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 sm:p-0 text-neutral-700 hover:text-neutral-950"
              aria-label={`Shopping bag${totalQuantity > 0 ? `, ${totalQuantity} items` : ''}`}
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline-flex items-center gap-1.5 text-body-sm font-medium uppercase tracking-wider">
                Bag
                {totalQuantity > 0 && (
                  <span className="text-gold-600">({totalQuantity})</span>
                )}
              </span>
              {totalQuantity > 0 && (
                <span
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 flex h-5 w-5 items-center justify-center text-[10px] font-bold text-cream-50 bg-gold-600 rounded-full"
                  aria-live="polite"
                >
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block border-t border-neutral-200" aria-label="Main navigation">
          <ul className="flex justify-center gap-8 py-4 text-body-sm font-medium uppercase tracking-wider">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-neutral-700 hover:text-neutral-950 transition-colors duration-fast"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-neutral-950/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-cream-50 p-6 overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between mb-8">
              <span className="font-heading text-display-sm tracking-tight text-neutral-950">
                <span className="flex items-baseline gap-1.5 font-light">
                  <span>Style Statement</span>
                  <span className="text-body-xs uppercase tracking-[0.3em] text-neutral-500">by Shakthi</span>
                </span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-neutral-700 hover:text-neutral-950"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav aria-label="Mobile navigation">
              <ul className="space-y-4">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="block text-heading-sm font-medium text-neutral-950 hover:text-gold-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-10 border-t border-neutral-200 pt-6 space-y-4">
              <Link
                href="/account"
                className="block text-body font-medium text-neutral-700 hover:text-neutral-950"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Account
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); openCart(); }}
                className="w-full text-left flex items-center gap-3 text-body font-medium text-neutral-700 hover:text-neutral-950"
              >
                <ShoppingBag className="h-5 w-5" />
                Shopping Bag
                {totalQuantity > 0 && (
                  <span className="ml-auto text-gold-600 font-bold">({totalQuantity})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24" role="dialog" aria-modal="true" aria-label="Search">
          <div className="absolute inset-0 bg-neutral-950/50" onClick={() => setSearchOpen(false)} />
          <form
            action="/search"
            onSubmit={() => setSearchOpen(false)}
            className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-strong overflow-hidden animate-scale-in"
          >
            <div className="flex items-center gap-4 p-4 border-b border-neutral-200">
              <Search className="h-5 w-5 text-neutral-400 flex-shrink-0" aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Search products, collections, journal..."
                className="flex-1 bg-transparent text-body text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
                autoFocus
                aria-label="Search"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-950"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <button type="submit" className="btn-primary w-full">
                Search
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}