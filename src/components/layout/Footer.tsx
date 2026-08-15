'use client';

import Link from 'next/link';
import { Instagram } from 'lucide-react';
import type { Menu, ShopPolicy } from '@/types/shopify';
import { NewsletterForm } from '@/components/home/NewsletterForm';

interface FooterProps {
  menus: Menu[];
  policies: {
    privacyPolicy: ShopPolicy | null;
    refundPolicy: ShopPolicy | null;
    termsOfService: ShopPolicy | null;
    shippingPolicy: ShopPolicy | null;
  };
  shopName?: string;
  shopEmail?: string;
}

const socialLinks = [
  { name: 'Instagram', href: 'https://instagram.com', ariaLabel: 'Follow us on Instagram' },
];

export function Footer({ menus, policies, shopName = 'Style Statement by Shakthi', shopEmail = 'hello@sss.com' }: FooterProps) {
  const mainMenu = menus.find((m) => m.handle === 'main-menu' || m.handle === 'footer');
  const footerMenus = mainMenu?.items.filter((item) => item.items && item.items.length > 0) || [];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-cream-50" role="contentinfo">
      {/* Main Footer Links */}
      <div className="py-16 sm:py-24 lg:py-28">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-2 space-y-6">
              <Link href="/" className="font-heading text-heading-lg sm:text-display-sm font-medium tracking-tight text-cream-50 block" aria-label={`${shopName} Home`}>
                {shopName}
              </Link>
              <p className="text-body-sm text-cream-50/55 max-w-xs leading-relaxed">
                Curated jewelry for the modern collector. Handcrafted with intention in Mumbai, shipped worldwide.
              </p>

              {/* Newsletter — editorial capture in the brand rail */}
              <div className="pt-1">
                <p className="text-caption font-medium uppercase tracking-[0.18em] text-cream-50/70 mb-3">
                  The Collective — Join the list
                </p>
                <NewsletterForm />
              </div>

              <a
                href={socialLinks[0].href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-body-sm text-cream-50/55 hover:text-cream-50 transition-colors"
                aria-label={socialLinks[0].ariaLabel}
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                {socialLinks[0].name}
              </a>
            </div>

            {/* Navigation Columns */}
            {footerMenus.map((menuItem) => (
              <nav key={menuItem.title} aria-label={menuItem.title}>
                <h3 className="text-caption font-medium uppercase tracking-[0.18em] mb-4 text-cream-50/70">
                  {menuItem.title}
                </h3>
                <ul className="space-y-2.5" role="list">
                  {menuItem.items?.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.url}
                        className="text-body-sm text-cream-50/55 hover:text-cream-50 transition-colors block py-0.5"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* Contact Column */}
            <div className="sm:col-span-2 md:col-span-1 space-y-4">
              <h3 className="text-caption font-medium uppercase tracking-[0.18em] text-cream-50/70">
                Contact
              </h3>
              <address className="not-italic text-body-sm text-cream-50/55 space-y-2.5">
                <a href={`mailto:${shopEmail}`} className="block hover:text-cream-50 transition-colors">
                  {shopEmail}
                </a>
                <a href="tel:+9122xxxxxxx" className="block hover:text-cream-50 transition-colors">
                  +91 22 XXXX XXXX
                </a>
                <p className="pt-1 text-caption text-cream-50/40">
                  Mon–Fri, 10am–6pm IST
                </p>
              </address>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream-50/10">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-body-sm text-cream-50/40">
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
                    className="text-body-sm text-cream-50/40 hover:text-cream-50 transition-colors"
                  >
                    {label}
                  </Link>
                )
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}