import { Metadata } from 'next';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { fetchProducts } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search our curated collection of fine jewelry.',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const products = query
    ? (await fetchProducts(48, undefined, undefined, false, query)).edges.map(({ node }) => node)
    : [];

  return (
    <div className="flex flex-col">
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">Search</span>
          </nav>
          <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-4">Search</h1>

          <form action="/search" className="flex gap-3 max-w-xl">
            <label htmlFor="search-input" className="sr-only">Search products</label>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
              <input
                id="search-input"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search products, collections, gemstones..."
                className="input pl-12"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>
      </header>

      <section className="section" aria-label="Search results">
        <div className="container">
          {!query ? (
            <div className="py-16 text-center">
              <p className="text-body text-neutral-500">
                Enter a search term above to explore the collection. Try &ldquo;diamond&rdquo;, &ldquo;gold&rdquo;, or &ldquo;ring&rdquo;.
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <h2 className="font-heading text-heading-lg text-neutral-950 mb-2">No results for &ldquo;{query}&rdquo;</h2>
              <p className="text-body text-neutral-500 mb-6">
                Try a different term, or browse our collections instead.
              </p>
              <Link href="/collections" className="btn-secondary">Browse Collections</Link>
            </div>
          ) : (
            <>
              <p className="text-body-sm text-neutral-500 mb-8">
                {products.length} result{products.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </p>
              <ProductGrid products={products} columns={4} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}