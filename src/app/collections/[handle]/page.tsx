import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SortDropdown } from '@/components/product/SortDropdown';
import { OptimizedImage } from '@/components/ui/Image';
import { fetchCollection, fetchCollections, fetchShop } from '@/lib/shopify';
import type { Product } from '@/types/shopify';

interface CollectionPageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ page?: string; sort?: string; min?: string; max?: string; tag?: string }>;
}

function sortProducts(products: Product[], sortKey?: string): Product[] {
  const list = [...products];
  switch (sortKey) {
    case 'TITLE_ASC':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'TITLE_DESC':
      return list.sort((a, b) => b.title.localeCompare(a.title));
    case 'PRICE_ASC':
      return list.sort(
        (a, b) => a.priceRange.minVariantPrice.amount - b.priceRange.minVariantPrice.amount
      );
    case 'PRICE_DESC':
      return list.sort(
        (a, b) => b.priceRange.minVariantPrice.amount - a.priceRange.minVariantPrice.amount
      );
    case 'CREATED_DESC':
      return list.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    case 'BEST_SELLING':
    default:
      return list;
  }
}

async function getCollectionData(handle: string, searchParams: { page?: string; sort?: string; min?: string; max?: string; tag?: string }) {
  const page = parseInt(searchParams.page || '1');
  const first = 24;
  
  const [collection, allCollections, shop] = await Promise.all([
    fetchCollection(handle, first),
    fetchCollections(20),
    fetchShop(),
  ]);

  if (!collection) return null;

  return {
    collection,
    allCollections: allCollections.edges.map(({ node }) => node),
    shop,
    currentPage: page,
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : (params as { handle: string });
  const collection = await fetchCollection(resolvedParams?.handle, 1);
  if (!collection) {
    return { title: 'Collection Not Found' };
  }
  return {
    title: collection.title,
    description: collection.description || `Shop the ${collection.title} collection at Style Statement by Shakthi.`,
    openGraph: {
      title: collection.title,
      description: collection.description || `Shop the ${collection.title} collection at Style Statement by Shakthi.`,
      images: collection.image ? [{ url: collection.image.url, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const data = await getCollectionData(resolvedParams.handle, resolvedSearchParams);
  
  if (!data) {
    notFound();
  }

  const { collection, allCollections, shop, currentPage } = data;
  const rawProducts = collection.products.edges.map(({ node }) => node);
  const sortedProducts = sortProducts(rawProducts, resolvedSearchParams.sort);

  const hasNextPage = collection.products.pageInfo.hasNextPage;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/collections" className="hover:text-neutral-950 transition-colors">Collections</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">{collection.title}</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              {collection.image && (
                <OptimizedImage
                  src={collection.image.url}
                  alt={collection.image.altText || collection.title}
                  width={80}
                  height={80}
                  className="mb-4 rounded-lg"
                />
              )}
              <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-2">{collection.title}</h1>
              {collection.description && (
                <p className="text-body-lg text-neutral-600 max-w-2xl">{collection.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4" role="group" aria-label="Collection actions">
              <SortDropdown currentSort={resolvedSearchParams.sort} />
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <section className="section" aria-labelledby="products-heading">
        <div className="container">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <h2 id="products-heading" className="sr-only">Products</h2>
            <p className="text-body-sm text-neutral-500">
              {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} in this collection
            </p>
          </div>

          <ProductGrid
            products={sortedProducts}
            columns={4}
          />

          {/* Pagination */}
          {(hasPrevPage || hasNextPage) && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              {hasPrevPage && (
                <Link
                  href={`/collections/${collection.handle}?page=${currentPage - 1}`}
                  className="btn-secondary px-4"
                  aria-label="Previous page"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 text-body text-neutral-500" aria-current="page">
                Page {currentPage}
              </span>
              {hasNextPage && (
                <Link
                  href={`/collections/${collection.handle}?page=${currentPage + 1}`}
                  className="btn-secondary px-4"
                  aria-label="Next page"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* Other Collections */}
      <section className="section bg-white border-y border-neutral-200" aria-labelledby="other-collections-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-8 sm:mb-12">
            <h2 id="other-collections-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight text-neutral-950 mb-2 sm:mb-4">
              Explore More Collections
            </h2>
          </header>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {allCollections
              .filter((c) => c.handle !== collection.handle)
              .slice(0, 4)
              .map((otherCollection, index) => (
                <Link
                  key={otherCollection.id}
                  href={`/collections/${otherCollection.handle}`}
                  className="relative group overflow-hidden rounded-xl aspect-4-5 animate-slide-up border border-neutral-200/80 shadow-subtle"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  {otherCollection.image ? (
                    <OptimizedImage
                      src={otherCollection.image.url}
                      alt={otherCollection.image.altText || otherCollection.title}
                      fill
                      className="transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-4-5 bg-neutral-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-center">
                    <h3 className="font-heading text-body sm:text-heading-md text-cream-50 font-medium">{otherCollection.title}</h3>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}