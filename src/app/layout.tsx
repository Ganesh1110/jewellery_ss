import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { CartProvider } from '@/context/CartContext';
import { fetchShop, fetchMenus } from '@/lib/shopify';

const inter = { variable: 'font-sans' };
const cormorant = { variable: 'font-serif' };

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Style Statement by Shakthi — Curated Jewelry for the Modern Collector',
    template: '%s | Style Statement by Shakthi',
  },
  description: 'Handcrafted jewelry with intention. Explore our curated collections of fine jewelry, shipped worldwide from Mumbai.',
  keywords: ['jewelry', 'fine jewelry', 'handcrafted', 'gold', 'diamonds', 'gemstones', 'mumbai'],
  authors: [{ name: 'Style Statement by Shakthi' }],
  creator: 'Style Statement by Shakthi',
  publisher: 'Style Statement by Shakthi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Style Statement by Shakthi',
    title: 'Style Statement by Shakthi — Curated Jewelry for the Modern Collector',
    description: 'Handcrafted jewelry with intention. Explore our curated collections.',
    images: [
      {
        url: '/og-default.svg',
        width: 1440,
        height: 720,
        alt: 'Style Statement by Shakthi Jewelry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Style Statement by Shakthi — Curated Jewelry',
    description: 'Handcrafted jewelry with intention.',
    images: ['/og-default.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
};

interface LayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: LayoutProps) {
  const [shop, menus] = await Promise.all([fetchShop(), fetchMenus()]);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
      </head>
      <body className="bg-cream-50 text-neutral-900 antialiased">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <CartProvider>
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
          <Footer menus={menus} policies={shop.policies} shopName={shop.name} />
          <CartDrawer />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  );
}