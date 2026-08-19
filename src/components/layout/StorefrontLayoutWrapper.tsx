'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CookieConsent } from '@/components/ui/CookieConsent';
import type { Menu, ShopPolicy } from '@/types/shopify';

import { MessageCircle } from 'lucide-react';

interface StorefrontLayoutWrapperProps {
  children: React.ReactNode;
  menus: Menu[];
  policies: {
    privacyPolicy: ShopPolicy | null;
    refundPolicy: ShopPolicy | null;
    termsOfService: ShopPolicy | null;
    shippingPolicy: ShopPolicy | null;
  };
  shopName: string;
  freeShippingThreshold?: string;
  shopEmail?: string;
  announcementText?: string;
  announcementMarquee?: boolean;
  announcementEnabled?: boolean;
  whatsappNumber?: string;
}

export function StorefrontLayoutWrapper({
  children,
  menus,
  policies,
  shopName,
  freeShippingThreshold,
  shopEmail,
  announcementText,
  announcementMarquee,
  announcementEnabled,
  whatsappNumber = '+919876543210',
}: StorefrontLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '');

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-neutral-950 text-cream-50 px-4 py-2 rounded"
      >
        Skip to main content
      </a>
      <Header
        shopName={shopName}
        freeShippingThreshold={freeShippingThreshold}
        shopEmail={shopEmail}
        announcementText={announcementText}
        announcementMarquee={announcementMarquee}
        announcementEnabled={announcementEnabled}
      />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer menus={menus} policies={policies} shopName={shopName} shopEmail={shopEmail} />
      <CartDrawer freeShippingThreshold={freeShippingThreshold} />
      <CookieConsent />

      {/* Floating WhatsApp Action Button */}
      {cleanPhone && (
        <a
          href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent('Hi! I have an inquiry about Style Statement by Shakthi.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-13 w-13 rounded-full bg-emerald-600 text-white shadow-medium hover:bg-emerald-700 transition-all hover:scale-105"
          aria-label="Chat with us on WhatsApp"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="h-7 w-7 fill-white text-emerald-600" />
        </a>
      )}
    </>
  );
}
