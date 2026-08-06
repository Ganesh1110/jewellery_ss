import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles, Truck, RotateCcw, Shield, Gem } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { OptimizedImage } from '@/components/ui/Image';
import { fetchProducts, fetchCollections, fetchShop } from '@/lib/shopify';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Curated Jewelry for the Modern Collector',
  description: 'Handcrafted fine jewelry with intention. Explore our collections of gold, diamonds, and gemstones. Shipped worldwide from Mumbai.',
};

const features = [
  { icon: Gem, title: 'Handcrafted Excellence', description: 'Each piece is meticulously crafted by master artisans in Mumbai using traditional techniques.' },
  { icon: Shield, title: 'Certified Quality', description: 'All diamonds and gemstones are ethically sourced and certified for authenticity.' },
  { icon: Truck, title: 'Global Shipping', description: 'Complimentary worldwide shipping on orders over ₹15,000. Duties included for select regions.' },
  { icon: RotateCcw, title: '14-Day Returns', description: 'Not quite right? Return within 14 days for a full refund or exchange.' },
];

async function getHomepageData() {
  const [featuredProducts, collections, shop] = await Promise.all([
    fetchProducts(8, undefined, 'BEST_SELLING'),
    fetchCollections(6),
    fetchShop(),
  ]);

  return {
    featuredProducts: featuredProducts.edges.map(({ node }) => node),
    collections: collections.edges.map(({ node }) => node),
    shop,
  };
}

export default async function HomePage() {
  const { featuredProducts, collections, shop } = await getHomepageData();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-50 to-transparent" aria-hidden="true" />
        
        <div className="container relative z-10 py-16 sm:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <span className="inline-block overline text-gold-600 mb-6 animate-slide-up delay-100">
              New Collection — Summer 2024
            </span>
            <h1 className="font-heading text-display-xl sm:text-display-lg lg:text-display-xl tracking-tight text-neutral-950 mb-6 animate-slide-up delay-200">
              Jewelry That Tells<br /><span className="text-gold-600">Your Story</span>
            </h1>
            <p className="text-body-lg text-neutral-600 max-w-2xl mx-auto mb-10 animate-slide-up delay-300">
              Curated collections of fine jewelry handcrafted with intention. Each piece designed to become a cherished heirloom, passed down through generations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-400">
              <Link
                href="/collections/new-arrivals"
                className="btn-primary w-full sm:w-auto"
              >
                Shop New Arrivals <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/collections"
                className="btn-secondary w-full sm:w-auto"
              >
                View All Collections
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="h-6 w-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-white border-y border-neutral-200" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="sr-only">Our Promise</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="text-center p-4 sm:p-6 animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-neutral-100 text-neutral-950 mb-4">
                  <feature.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-heading-sm text-neutral-950 mb-2">{feature.title}</h3>
                <p className="text-body-sm text-neutral-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="section" aria-labelledby="collections-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-16 animate-fade-in">
            <span className="overline text-gold-600 mb-3 inline-block">Explore by Category</span>
            <h2 id="collections-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-4">
              Our Collections
            </h2>
            <p className="text-body-lg text-neutral-600">
              Discover jewelry organized by style, occasion, and gemstone. Each collection tells a unique story.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <article
                key={collection.id}
                className="relative group overflow-hidden rounded-xl animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <Link
                  href={`/collections/${collection.handle}`}
                  className="block"
                  aria-label={`Shop ${collection.title} collection`}
                >
                  {collection.image && (
                    <OptimizedImage
                      src={collection.image.url}
                      alt={collection.image.altText || collection.title}
                      fill
                      className="transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-neutral-950/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                    <h3 className="font-heading text-heading-lg text-cream-50 mb-2">{collection.title}</h3>
                    <p className="text-body-sm text-cream-50/80 mb-4 line-clamp-2">{collection.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-cream-50">
                      Shop Collection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="text-center mt-12 animate-fade-in delay-300">
            <Link href="/collections" className="btn-secondary">
              View All Collections <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section bg-white border-y border-neutral-200" aria-labelledby="featured-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
            <span className="overline text-gold-600 mb-3 inline-block">Best Sellers</span>
            <h2 id="featured-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-4">
              Customer Favorites
            </h2>
            <p className="text-body-lg text-neutral-600">
              Our most-loved pieces, chosen by collectors worldwide.
            </p>
          </header>

          <ProductGrid products={featuredProducts} columns={4} />

          <div className="text-center mt-12">
            <Link href="/collections/bestsellers" className="btn-secondary">
              Shop All Bestsellers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="section bg-neutral-950 text-cream-50" aria-labelledby="newsletter-heading">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 id="newsletter-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight mb-4">
              Join the Style Statement by Shakthi Collective
            </h2>
            <p className="text-body-lg text-cream-50/70 mb-8">
              Receive early access to new collections, private sales, and editorial stories from our journal.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" action="#">
              <label htmlFor="home-email" className="sr-only">Email address</label>
              <input
                type="email"
                id="home-email"
                name="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent border border-neutral-700 text-cream-50 placeholder:text-neutral-500 text-body-sm px-4 py-3.5 min-h-[48px] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 focus:outline-none transition-all"
                required
              />
              <button type="submit" className="btn-gold whitespace-nowrap">
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-4 text-caption text-neutral-500">
              By subscribing, you agree to our <a href="/privacy-policy" className="underline hover:text-gold-400">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="section" aria-labelledby="story-heading">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative aspect-4-5 overflow-hidden">
              <OptimizedImage
                src={shop.brand?.coverImage?.url || '/brand-story.svg'}
                alt={shop.brand?.coverImage?.altText || 'Style Statement by Shakthi Brand Story'}
                fill
                priority
                className="object-cover"
              />
            </div>
            <div>
              <span className="overline text-gold-600 mb-3 inline-block">Our Story</span>
              <h2 id="story-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-6">
                Crafted with Intention
              </h2>
              <div className="prose prose-neutral max-w-none">
                <p className="text-body-lg text-neutral-600 mb-6">
                  {shop.brand?.shortDescription || 'Founded in Mumbai, Style Statement by Shakthi began with a simple belief: jewelry should be more than adornment. It should be a reflection of your journey, a keeper of memories, a companion through life\'s most meaningful moments.'}
                </p>
                <p className="text-body text-neutral-600 mb-6">
                  Every piece in our collection is designed in-house and handcrafted by master artisans who have honed their craft over generations. We use only ethically sourced diamonds, certified gemstones, and recycled precious metals.
                </p>
                <p className="text-body text-neutral-600 mb-8">
                  When you choose Style Statement by Shakthi, you&apos;re not just buying jewelry — you&apos;re becoming part of a legacy of craftsmanship, intention, and timeless beauty.
                </p>
                <Link href="/about" className="btn-secondary inline-flex items-center gap-2">
                  Our Journey <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}