import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Truck, RotateCcw, Shield, Gem } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { HeroSlider } from '@/components/home/HeroSlider';
import { Testimonials } from '@/components/home/Testimonials';
import { OptimizedImage } from '@/components/ui/Image';
import { fetchProducts, fetchCollections, fetchShop } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'Curated Jewelry for the Modern Collector',
  description: 'Handcrafted fine jewelry with intention. Explore our collections of gold, diamonds, and gemstones. Shipped worldwide from Mumbai.',
};

const heroSlides = [
  { src: '/images/Image1.jpeg', alt: 'Signature gold jewelry statement piece' },
  { src: '/images/Image5.jpeg', alt: 'Handcrafted gold ornaments from the atelier' },
  { src: '/images/Image9.jpeg', alt: 'Fine jewelry modelled for the modern collector' },
];

const localCollectionImages = [
  '/images/Image2.jpeg',
  '/images/Image6.jpeg',
  '/images/Image9.jpeg',
  '/images/Image1.jpeg',
  '/images/Image5.jpeg',
  '/images/Image2.jpeg',
];

const brandStoryImage = '/images/Image6.jpeg';

const features = [
  { icon: Gem, title: 'Artisanal Craftsmanship', description: 'Each piece is meticulously crafted in Mumbai by master artisans using traditional techniques.' },
  { icon: Shield, title: 'Certified Authenticity', description: 'All diamonds and gemstones are 100% ethically sourced and certified.' },
  { icon: Truck, title: 'Complimentary Shipping', description: 'Free worldwide shipping on orders over ₹15,000. Delivered securely to your door.' },
  { icon: RotateCcw, title: '14-Day Returns', description: 'Complimentary return and exchange window within 14 days of purchase.' },
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
    <div className="flex flex-col bg-cream-50">
      {/* Hero Section */}
      <HeroSlider slides={heroSlides} className="min-h-[75vh] sm:min-h-[82vh] lg:min-h-[88vh]">
        <div className="max-w-3xl text-cream-50">
          <span className="inline-block overline text-gold-300 mb-4 animate-slide-up delay-100">
            Akiiko-Inspired Luxury Collection
          </span>
          <h1 className="font-heading text-display-xl tracking-tight text-cream-50 mb-6 animate-slide-up delay-200">
            Jewelry Crafted<br />
            <span className="text-gold-300">With Intention</span>
          </h1>
          <p className="text-body-lg text-cream-50/90 max-w-2xl mx-auto sm:mx-0 mb-8 animate-slide-up delay-300">
            Curated collections of fine jewelry designed to celebrate everyday moments and become lifelong family heirlooms.
          </p>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-4 animate-slide-up delay-400">
            <Link
              href="/collections/new-arrivals"
              className="btn-gold w-full sm:w-auto"
            >
              Shop New Arrivals <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/collections"
              className="btn-secondary text-cream-50 border-cream-50/50 hover:bg-cream-50 hover:text-neutral-950 w-full sm:w-auto"
            >
              View All Collections
            </Link>
          </div>
        </div>
      </HeroSlider>

      {/* Brand Value Promises Strip */}
      <section className="bg-white border-y border-neutral-200/80 py-8" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="sr-only">Our Promise</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left p-2 animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 80}ms` }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-sans text-body font-semibold text-neutral-950 mb-1">{feature.title}</h3>
                  <p className="text-caption text-neutral-500 leading-snug">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="section" aria-labelledby="collections-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
            <span className="overline mb-2 inline-block">Curated Categories</span>
            <h2 id="collections-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-3">
              Shop by Collection
            </h2>
            <p className="text-body text-neutral-600">
              Discover timeless pieces organized by design, gemstone, and everyday elegance.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {collections.map((collection, index) => (
              <article
                key={collection.id}
                className="relative group overflow-hidden rounded-xl bg-white border border-neutral-200/80 shadow-subtle hover:shadow-medium transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <Link
                  href={`/collections/${collection.handle}`}
                  className="block relative aspect-4-5 overflow-hidden"
                  aria-label={`Shop ${collection.title} collection`}
                >
                  {localCollectionImages[index % localCollectionImages.length] && (
                    <OptimizedImage
                      src={localCollectionImages[index % localCollectionImages.length]}
                      alt={collection.title}
                      fill
                      priority={index < 3}
                      className="transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-cream-50">
                    <span className="text-caption uppercase tracking-widest text-gold-300 mb-1 block">Collection</span>
                    <h3 className="font-heading text-heading-lg text-cream-50 mb-2">{collection.title}</h3>
                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-cream-50 group-hover:text-gold-300 transition-colors">
                      Explore Collection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/collections" className="btn-secondary">
              View All Categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section bg-white border-y border-neutral-200/80" aria-labelledby="featured-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
            <span className="overline mb-2 inline-block">Collector Favorites</span>
            <h2 id="featured-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-3">
              Best Selling Creations
            </h2>
            <p className="text-body text-neutral-600">
              Our most celebrated designs, chosen by collectors worldwide.
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

      {/* Testimonials */}
      <Testimonials />

      {/* Brand Story */}
      <section className="section" aria-labelledby="story-heading">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative aspect-4-5 rounded-xl overflow-hidden shadow-medium border border-neutral-200/80">
              <OptimizedImage
                src={brandStoryImage}
                alt="Style Statement by Shakthi Atelier"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="space-y-6">
              <span className="overline">Our Atelier Story</span>
              <h2 id="story-heading" className="font-heading text-display-md tracking-tight text-neutral-950">
                Crafted with Intention & Ethics
              </h2>
              <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
                <p className="text-body-lg text-neutral-800 leading-relaxed">
                  {shop.brand?.shortDescription || 'Founded in Mumbai, Style Statement by Shakthi began with a simple philosophy: jewelry should be more than decoration — it should be a quiet statement of individuality.'}
                </p>
                <p className="text-body leading-relaxed">
                  Every ring, pendant, and cuff in our studio is sculpted by hand using certified 100% recycled metals and conflict-free gemstones. Our goal is to create heirloom pieces that minimize environmental impact while maximizing beauty.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/about" className="btn-primary inline-flex items-center gap-2">
                  Our Sustainability Journey <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}