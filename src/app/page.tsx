import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

async function getHomepageData() {
  const [featuredProducts, collections, shop] = await Promise.all([
    fetchProducts(4, undefined, 'BEST_SELLING'),
    fetchCollections(4),
    fetchShop(),
  ]);

  return {
    featuredProducts: featuredProducts.edges.map(({ node }) => node).slice(0, 4),
    collections: collections.edges.map(({ node }) => node).slice(0, 4),
    shop,
  };
}

export default async function HomePage() {
  const { featuredProducts, collections, shop } = await getHomepageData();

  return (
    <div className="flex flex-col bg-cream-50">
      {/* Hero Section */}
      <HeroSlider slides={heroSlides} className="min-h-[75vh] sm:min-h-[82vh] lg:min-h-[88vh]">
        <div className="max-w-3xl text-cream-50 mx-auto sm:mx-0">
          <span className="inline-block text-caption font-sans font-medium tracking-[0.22em] uppercase text-cream-50/80 mb-4 sm:mb-6">
            Handcrafted in Mumbai
          </span>
          <h1 className="font-heading font-light text-4xl sm:text-display-lg lg:text-display-xl tracking-tight text-cream-50 mb-4 sm:mb-6">
            Jewelry with<br />
            <span className="italic text-cream-50/90">intention, worn daily</span>
          </h1>
          <p className="text-body-sm sm:text-body-lg text-cream-50/85 max-w-2xl mx-auto sm:mx-0 mb-8 sm:mb-10">
            Quietly sculpted pieces in gold and gemstone, made to be worn every day and handed down for generations.
          </p>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-3 sm:gap-4">
            <Link
              href="/collections/new-arrivals"
              className="btn-primary w-full sm:w-auto text-cream-50 !bg-cream-50 !text-neutral-950 hover:!bg-cream-100 px-7"
            >
              Shop New Arrivals
            </Link>
            <Link
              href="/collections"
              className="btn-secondary w-full sm:w-auto !text-cream-50 border-cream-50/40 hover:border-cream-50 hover:!bg-cream-50 hover:!text-neutral-950 px-7"
            >
              View All Collections
            </Link>
          </div>
        </div>
      </HeroSlider>

      {/* Featured Collections — editorial split */}
      <section className="section" aria-labelledby="collections-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
            <span className="overline mb-3 inline-block">Curated Categories</span>
            <h2 id="collections-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight text-neutral-950 mb-4">
              Shop by Collection
            </h2>
            <p className="text-body-sm sm:text-body text-neutral-600">
              Timeless pieces organized by design and everyday elegance.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8">
            {collections.slice(0, 4).map((collection, index) => (
              <article
                key={collection.id}
                className="group relative overflow-hidden"
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
                      priority={index < 2}
                      className="transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/55 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8 flex items-end justify-between gap-4 text-cream-50">
                    <div>
                      <span className="block text-caption font-sans uppercase tracking-[0.18em] text-cream-50/80 mb-1">
                        Collection
                      </span>
                      <h3 className="font-heading text-body sm:text-heading-lg text-cream-50 font-medium">{collection.title}</h3>
                    </div>
                    <span className="hidden sm:flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-cream-50/90">
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="text-center mt-12 sm:mt-16">
            <Link href="/collections" className="btn-secondary">
              View All Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section bg-white border-y border-neutral-950/10" aria-labelledby="featured-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-20">
            <span className="overline mb-3 inline-block">Collector Favorites</span>
            <h2 id="featured-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight text-neutral-950 mb-4">
              Best Selling Creations
            </h2>
            <p className="text-body text-neutral-600">
              Our most-worn designs, chosen by collectors around the world.
            </p>
          </header>

          <ProductGrid products={featuredProducts} columns={4} />

          <div className="text-center mt-14 sm:mt-20">
            <Link href="/collections/bestsellers" className="btn-secondary">
              Shop All Bestsellers
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Brand Story */}
      <section className="section" aria-labelledby="story-heading">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-4-5 overflow-hidden">
              <OptimizedImage
                src={brandStoryImage}
                alt="Style Statement by Shakthi Atelier"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="space-y-6 max-w-xl">
              <span className="overline">Our Atelier Story</span>
              <h2 id="story-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight text-neutral-950">
                Crafted with intention, worn for a lifetime
              </h2>
              <div className="space-y-5 text-neutral-600">
                <p className="text-body-lg text-neutral-800 leading-relaxed">
                  {shop.brand?.shortDescription || 'Founded in Mumbai, Style Statement by Shakthi began with a simple philosophy: jewelry should be more than decoration — it should be a quiet statement of individuality.'}
                </p>
                <p className="text-body leading-relaxed">
                  Every ring, pendant, and cuff in our studio is sculpted by hand using certified recycled metals and conflict-free gemstones — heirloom pieces that minimize environmental impact while maximizing beauty.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/about" className="btn-primary">
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}