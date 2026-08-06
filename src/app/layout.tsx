import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import { fetchShop, fetchMenus } from '@/lib/shopify';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: true,
  weight: ['300', '400', '500', '600', '700'],
});

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

  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
      </head>
      <body className="bg-cream-50 text-neutral-900 antialiased">
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-neutral-950 text-cream-50 px-4 py-2 rounded"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="min-h-screen pt-16 sm:pt-20">
            {children}
          </main>
          <Footer menus={menus} policies={shop.policies} shopName={shop.name} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}