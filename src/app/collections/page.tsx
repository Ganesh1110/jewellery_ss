import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/Image';
import { fetchCollections, fetchShop } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'All Collections',
  description: 'Explore our complete range of curated jewelry collections. From everyday essentials to statement pieces for special occasions.',
};

async function getCollectionsData() {
  const [collections, shop] = await Promise.all([
    fetchCollections(50),
    fetchShop(),
  ]);

  return {
    collections: collections.edges.map(({ node }) => node),
    shop,
  };
}

export default async function CollectionsPage() {
  const { collections, shop } = await getCollectionsData();

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">Collections</span>
          </nav>
          <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-4">All Collections</h1>
          <p className="text-body-lg text-neutral-600 max-w-2xl">
            Discover our complete range of curated jewelry. Each collection is thoughtfully designed around a theme, gemstone, or occasion.
          </p>
        </div>
      </header>

      {/* Collections Grid */}
      <section className="section" aria-labelledby="collections-grid-heading">
        <div className="container">
          <h2 id="collections-grid-heading" className="sr-only">Browse Collections</h2>
          
          {collections.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-body text-neutral-500">No collections available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {collections.map((collection, index) => (
                <article
                  key={collection.id}
                  className="relative group overflow-hidden rounded-xl animate-slide-up border border-neutral-200/80 shadow-subtle bg-white"
                  style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                >
                  <Link
                    href={`/collections/${collection.handle}`}
                    className="block relative aspect-4-5 overflow-hidden"
                    aria-label={`Shop ${collection.title} collection`}
                  >
                    {collection.image ? (
                      <OptimizedImage
                        src={collection.image.url}
                        alt={collection.image.altText || collection.title}
                        fill
                        className="transition-transform duration-700 ease-out-expo group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <span className="text-body text-neutral-400">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-center">
                      <h3 className="font-heading text-heading-md sm:text-heading-lg text-cream-50 mb-1 sm:mb-2">{collection.title}</h3>
                      <p className="text-caption sm:text-body-sm text-cream-50/80 mb-3 line-clamp-2">{collection.description || 'Explore this curated collection of fine jewelry.'}</p>
                      <span className="inline-flex items-center gap-1.5 text-caption sm:text-body-sm font-medium text-cream-50 group-hover:text-gold-300 transition-colors">
                        Shop Collection <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link href="/journal" className="btn-secondary">
              Read Our Journal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}