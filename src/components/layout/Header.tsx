'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  ShoppingBag,
  Search,
  User,
} from 'lucide-react';

const navigation = [
  { name: 'Collections', href: '/collections' },
  { name: 'New Arrivals', href: '/collections/new-arrivals' },
  { name: 'Bestsellers', href: '/collections/bestsellers' },
  { name: 'Journal', href: '/journal' },
];

export function Header() {
  const { totalQuantity, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
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
        'sticky top-0 left-0 right-0 z-50 bg-cream-50/95 backdrop-blur-md border-b border-neutral-950/10 transition-shadow duration-normal',
        scrolled && 'shadow-[0_8px_24px_-20px_rgba(0,0,0,0.18)]'
      )}
      onKeyDown={handleKeyDown}
      role="banner"
    >
      {/* Announcement Bar */}
      <div className="bg-neutral-950 text-cream-50 py-2.5 px-4 text-center text-caption uppercase tracking-[0.2em] font-medium">
        Complimentary shipping on orders over ₹15,000
      </div>

      {/* Main Header */}
      <div className="relative max-w-container-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 -ml-2 text-neutral-700 hover:text-neutral-950 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <div className="flex-1 flex justify-center sm:justify-start lg:justify-center">
            <Link
              href="/"
              className="font-heading tracking-tight text-neutral-950 hover:opacity-85 transition-opacity"
              aria-label="Style Statement by Shakthi Home"
            >
              <span className="flex items-baseline gap-2">
                <span className="font-heading text-heading-lg sm:text-display-sm font-semibold tracking-tight">Style Statement</span>
                <span className="text-[10px] sm:text-body-xs uppercase tracking-[0.25em] text-neutral-500 font-sans">by Shakthi</span>
              </span>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Search */}
            <button
              className="p-2 sm:px-3 sm:py-1.5 text-neutral-700 hover:text-neutral-950 transition-colors"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline-flex items-center gap-2 text-body-sm font-medium uppercase tracking-[0.14em]">
                <Search className="h-4 w-4" />
                Search
              </span>
            </button>

            {/* Account */}
            <Link
              href="/account"
              className="p-2 sm:px-3 sm:py-1.5 text-neutral-700 hover:text-neutral-950 transition-colors"
              aria-label="Account"
            >
              <User className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline text-body-sm font-medium uppercase tracking-[0.14em]">Account</span>
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 sm:px-3 sm:py-1.5 text-neutral-700 hover:text-neutral-950 transition-colors"
              aria-label={`Shopping bag${totalQuantity > 0 ? `, ${totalQuantity} items` : ''}`}
            >
              <ShoppingBag className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline-flex items-center gap-2 text-body-sm font-medium uppercase tracking-[0.14em]">
                Bag
                {totalQuantity > 0 && (
                  <span className="text-neutral-950 font-medium">({totalQuantity})</span>
                )}
              </span>
              {totalQuantity > 0 && (
                <span
                  className="sm:hidden absolute top-1 right-1 flex h-4 w-4 items-center justify-center text-[9px] font-bold text-cream-50 bg-neutral-950 rounded-full"
                  aria-live="polite"
                >
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block border-t border-neutral-950/10" aria-label="Main navigation">
          <ul className="flex justify-center gap-12 py-3.5 text-body-sm font-medium tracking-[0.14em] uppercase text-neutral-700">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="hover:text-neutral-950 transition-colors duration-fast relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-neutral-950 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Menu Portal */}
      {mobileMenuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden flex" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-[110] w-full max-w-xs sm:max-w-sm h-full bg-cream-50 p-6 overflow-y-auto animate-slide-in-left flex flex-col justify-between border-r border-neutral-950/10 mr-auto">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-950/10">
                <span className="font-heading text-heading-lg tracking-tight text-neutral-950">
                  <span className="flex items-baseline gap-1.5 font-semibold">
                    <span>Style Statement</span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500">by Shakthi</span>
                  </span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Mobile Quick Search Input */}
              <form
                action="/search"
                onSubmit={() => setMobileMenuOpen(false)}
                className="relative mb-6"
              >
                <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search rings, necklaces, Gold..."
                  className="input pl-9 text-body-sm py-2.5 min-h-[42px]"
                />
              </form>

              <nav aria-label="Mobile navigation">
                <ul className="space-y-3">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="block text-body-lg font-medium text-neutral-950 hover:text-gold-600 transition-colors py-1 border-b border-neutral-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-6 space-y-3">
                <Link
                  href="/account"
                  className="flex items-center gap-3 text-body-sm font-medium text-neutral-700 hover:text-neutral-950 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4 text-neutral-400" />
                  My Account
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); openCart(); }}
                  className="w-full text-left flex items-center gap-3 text-body-sm font-medium text-neutral-700 hover:text-neutral-950 py-1"
                >
                  <ShoppingBag className="h-4 w-4 text-neutral-400" />
                  Shopping Bag
                  {totalQuantity > 0 && (
                    <span className="ml-auto text-neutral-950 font-bold">({totalQuantity})</span>
                  )}
                </button>
              </div>
            </div>

            {/* Support Info Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-200 text-caption text-neutral-500 space-y-2">
              <p className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px]">Client Concierge</p>
              <p>Mon–Fri: 10:00 AM – 6:00 PM IST</p>
              <p className="text-gold-600 font-medium">+91 22 XXXX XXXX &bull; hello@sss.com</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Search Modal Portal */}
      {searchOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-start" role="dialog" aria-modal="true" aria-label="Search">
          <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity" onClick={() => setSearchOpen(false)} />
          
          <div className="relative z-[110] w-full bg-cream-50 border-b border-neutral-950/10 animate-slide-up">
            <div className="max-w-container-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
              <form
                action="/search"
                onSubmit={() => setSearchOpen(false)}
                className="flex items-center gap-3 sm:gap-4 border-b border-neutral-950/20 pb-3 focus-within:border-neutral-950 transition-colors"
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-500 flex-shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search rings, necklaces, Gold, diamonds..."
                  className="flex-1 bg-transparent font-heading text-lg sm:text-display-sm text-neutral-950 placeholder:font-sans placeholder:text-body-sm sm:placeholder:text-body placeholder:text-neutral-400 focus:outline-none border-none p-0"
                  autoFocus
                  aria-label="Search"
                />
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-caption font-medium uppercase tracking-[0.14em] hidden sm:inline-flex"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 rounded-sm text-neutral-400 hover:text-neutral-950 transition-colors"
                  aria-label="Close search"
                >
                  <X className="h-6 w-6" />
                </button>
              </form>

              {/* Quick Trending Searches */}
              <div className="mt-4 pt-1 flex flex-wrap items-center gap-2 text-caption">
                <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Trending:</span>
                {[
                  { label: 'Gold Necklaces', query: 'gold' },
                  { label: 'Solitaire Rings', query: 'ring' },
                  { label: 'Bestsellers', query: 'bestseller' },
                  { label: 'New Arrivals', query: 'new' },
                  { label: 'Earrings', query: 'earrings' },
                ].map((tag) => (
                  <Link
                    key={tag.label}
                    href={`/search?q=${encodeURIComponent(tag.query)}`}
                    onClick={() => setSearchOpen(false)}
                    className="px-3 py-1.5 bg-neutral-950/[0.04] hover:bg-neutral-950 hover:text-cream-50 rounded-sm text-neutral-700 transition-colors font-sans font-medium text-caption"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}