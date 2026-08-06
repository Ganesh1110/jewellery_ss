'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CookieConsent } from '@/components/ui/CookieConsent';
import type { Menu, ShopPolicy } from '@/types/shopify';

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
}

export function StorefrontLayoutWrapper({ children, menus, policies, shopName }: StorefrontLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-neutral-950 text-cream-50 px-4 py-2 rounded"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer menus={menus} policies={policies} shopName={shopName} />
      <CartDrawer />
      <CookieConsent />
    </>
  );
}
