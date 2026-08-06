'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Menu, ShopPolicy } from '@/types/shopify';

interface FooterProps {
  menus: Menu[];
  policies: {
    privacyPolicy: ShopPolicy | null;
    refundPolicy: ShopPolicy | null;
    termsOfService: ShopPolicy | null;
    shippingPolicy: ShopPolicy | null;
  };
  shopName?: string;
}

const socialLinks = [
  { name: 'Instagram', href: 'https://instagram.com', icon: Instagram, ariaLabel: 'Follow us on Instagram' },
  { name: 'Facebook', href: 'https://facebook.com', icon: Facebook, ariaLabel: 'Follow us on Facebook' },
  { name: 'Twitter', href: 'https://twitter.com', icon: Twitter, ariaLabel: 'Follow us on Twitter' },
  { name: 'YouTube', href: 'https://youtube.com', icon: Youtube, ariaLabel: 'Subscribe on YouTube' },
];

const paymentMethods = ['Visa', 'Mastercard', 'American Express', 'PayPal', 'UPI'];

export function Footer({ menus, policies, shopName = 'Style Statement by Shakthi' }: FooterProps) {
  const mainMenu = menus.find((m) => m.handle === 'main-menu' || m.handle === 'footer');
  const footerMenus = mainMenu?.items.filter((item) => item.items && item.items.length > 0) || [];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-cream-50" role="contentinfo">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-800">
        <div className="container py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-display-sm sm:text-display-md tracking-tight mb-4">
              Join the Style Statement Collective
            </h2>
            <p className="text-body-lg text-cream-50/70 mb-8">
              Receive early access to new collections, private sales, and editorial stories.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" action="#">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                type="email"
                id="footer-email"
                name="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent border border-neutral-700 text-cream-50 placeholder:text-neutral-500 text-body-sm px-4 py-3.5 min-h-[48px] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 focus:outline-none transition-all"
                required
              />
              <button
                type="submit"
                className="btn-primary whitespace-nowrap"
              >
                Subscribe <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            <p className="mt-4 text-caption text-neutral-500">
              By subscribing, you agree to our <a href="/privacy-policy" className="underline hover:text-gold-400">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-6">
              <Link href="/" className="font-heading text-display-sm tracking-tight" aria-label={`${shopName} Home`}>
                {shopName}
              </Link>
              <p className="text-body-sm text-cream-50/60 max-w-xs">
                Curated jewelry for the modern collector. Handcrafted with intention in Mumbai, shipped worldwide.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-cream-50/50 hover:text-gold-400 transition-colors"
                    aria-label={social.ariaLabel}
                  >
                    <social.icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Columns */}
            {footerMenus.map((menuItem) => (
              <nav key={menuItem.title} aria-label={menuItem.title}>
                <h3 className="font-heading text-heading-sm uppercase tracking-wider mb-4 text-cream-50">
                  {menuItem.title}
                </h3>
                <ul className="space-y-3" role="list">
                  {menuItem.items?.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.url}
                        className="text-body-sm text-cream-50/70 hover:text-gold-400 transition-colors"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* Contact Column */}
            <div className="md:col-span-2 lg:col-span-1 space-y-4">
              <h3 className="font-heading text-heading-sm uppercase tracking-wider text-cream-50">
                Contact
              </h3>
              <address className="not-italic text-body-sm text-cream-50/70 space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 flex-shrink-0 text-cream-50/50" aria-hidden="true" />
                  <a href="mailto:hello@sss.com" className="hover:text-gold-400 transition-colors">
                    hello@sss.com
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <span className="h-5 w-5 flex-shrink-0 text-cream-50/50" aria-hidden="true">📞</span>
                  <a href="tel:+9122xxxxxxx" className="hover:text-gold-400 transition-colors">
                    +91 22 XXXX XXXX
                  </a>
                </div>
                <p className="pt-2">
                  Mon–Fri, 10am–6pm IST
                </p>
              </address>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-body-sm text-cream-50/50">
              © {currentYear} {shopName}. All rights reserved.
            </p>

            {/* Policies */}
            <nav aria-label="Legal policies" className="flex flex-wrap items-center justify-center gap-6">
              {[
                { policy: policies.privacyPolicy, label: 'Privacy' },
                { policy: policies.termsOfService, label: 'Terms' },
                { policy: policies.refundPolicy, label: 'Returns' },
                { policy: policies.shippingPolicy, label: 'Shipping' },
              ].map(({ policy, label }) => (
                policy && (
                  <Link
                    key={label}
                    href={policy.url}
                    className="text-body-sm text-cream-50/50 hover:text-gold-400 transition-colors"
                  >
                    {label}
                  </Link>
                )
              ))}
            </nav>

            {/* Payment Methods */}
            <div className="flex items-center gap-3 text-caption text-cream-50/50" aria-label="Accepted payment methods">
              <span>Accepted:</span>
              <ul className="flex items-center gap-2" role="list">
                {paymentMethods.map((method) => (
                  <li key={method} className="font-medium uppercase tracking-wider">
                    {method}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}