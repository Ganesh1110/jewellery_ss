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
      <header className="section-sm bg-white border-b border-neutral-950/10">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">Collections</span>
          </nav>
          <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-3">All Collections</h1>
          <p className="text-body-lg text-neutral-600 max-w-2xl">
            Each collection is thoughtfully designed around a theme, gemstone, or occasion.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {collections.map((collection) => (
                <article key={collection.id} className="group">
                  <Link
                    href={`/collections/${collection.handle}`}
                    className="block"
                    aria-label={`Shop ${collection.title} collection`}
                  >
                    <div className="relative aspect-4-5 overflow-hidden">
                      {collection.image ? (
                        <OptimizedImage
                          src={collection.image.url}
                          alt={collection.image.altText || collection.title}
                          fill
                          className="transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="w-full h-full bg-cream-100 flex items-center justify-center">
                          <span className="text-body text-neutral-400">No image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/50 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                        <h3 className="font-heading text-heading-md sm:text-heading-lg text-cream-50">{collection.title}</h3>
                        <p className="text-caption sm:text-body-sm text-cream-50/80 mt-1 line-clamp-2">
                          {collection.description || 'Curated pieces for the modern collector.'}
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link href="/journal" className="btn-secondary">
              Read Our Journal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}