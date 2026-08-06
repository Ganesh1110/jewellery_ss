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
      {/* Main Footer Links */}
      <div className="py-10 sm:py-16 lg:py-20">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-2 space-y-4 sm:space-y-6">
              <Link href="/" className="font-heading text-heading-lg sm:text-display-sm font-semibold tracking-tight text-cream-50 block" aria-label={`${shopName} Home`}>
                {shopName}
              </Link>
              <p className="text-body-sm text-cream-50/60 max-w-xs leading-relaxed">
                Curated jewelry for the modern collector. Handcrafted with intention in Mumbai, shipped worldwide.
              </p>
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-cream-50/70 hover:text-gold-400 hover:border-gold-500/40 transition-colors"
                    aria-label={social.ariaLabel}
                  >
                    <social.icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Columns */}
            {footerMenus.map((menuItem) => (
              <nav key={menuItem.title} aria-label={menuItem.title}>
                <h3 className="font-heading text-body-sm sm:text-heading-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4 text-gold-400">
                  {menuItem.title}
                </h3>
                <ul className="space-y-2.5" role="list">
                  {menuItem.items?.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.url}
                        className="text-body-sm text-cream-50/70 hover:text-cream-50 transition-colors block py-0.5"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* Contact Column */}
            <div className="sm:col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
              <h3 className="font-heading text-body-sm sm:text-heading-sm font-semibold uppercase tracking-wider text-gold-400">
                Contact
              </h3>
              <address className="not-italic text-body-sm text-cream-50/70 space-y-2.5">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 flex-shrink-0 text-gold-400" aria-hidden="true" />
                  <a href="mailto:hello@sss.com" className="hover:text-cream-50 transition-colors">
                    hello@sss.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 flex-shrink-0 text-gold-400 text-xs text-center" aria-hidden="true">📞</span>
                  <a href="tel:+9122xxxxxxx" className="hover:text-cream-50 transition-colors">
                    +91 22 XXXX XXXX
                  </a>
                </div>
                <p className="pt-1 text-caption text-cream-50/50">
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