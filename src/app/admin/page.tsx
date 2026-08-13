'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Package, Archive, ExternalLink, ShieldCheck, Tag, DollarSign, Layers } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import type { Product } from '@/types/shopify';
import { OptimizedImage } from '@/components/ui/Image';

export default function AdminDashboardPage() {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/products?first=100')
      .then((res) => (res.ok ? res.json() : { edges: [] }))
      .then((data: { edges: Array<{ node: Product }> }) => {
        setCustomProducts(data.edges.map((e) => e.node));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleArchive = async (id: string, title: string) => {
    if (confirm(`Archive "${title}"? Archived products can be restored from the inventory dashboard.`)) {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) setCustomProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream-50">
      {/* Header */}
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-4" aria-label="Breadcrumb">
            <span className="text-neutral-950 font-medium">Store Admin</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="overline text-gold-600 block mb-1">Store Owner Portal</span>
              <h1 className="font-heading text-display-md text-neutral-950">Catalog & Product Manager</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              <Link href="/admin/inventory" className="btn-secondary inline-flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory Dashboard
              </Link>
              <Link href="/admin/products/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Product
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Banner */}
      <section className="py-8 bg-white border-b border-neutral-200" aria-label="Store overview stats">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-caption uppercase text-neutral-500 font-medium">Custom Added Products</p>
                <p className="font-heading text-display-sm text-neutral-950">{customProducts.length}</p>
              </div>
            </div>

            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-caption uppercase text-neutral-500 font-medium">Active Collections</p>
                <p className="font-heading text-display-sm text-neutral-950">6 Collections</p>
              </div>
            </div>

            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-caption uppercase text-neutral-500 font-medium">Live Store Mode</p>
                <p className="text-body-sm font-semibold text-gold-600">Headless Catalog Active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product List */}
      <section className="section" aria-label="Custom products list">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-heading-lg text-neutral-950">Published Products</h2>
            <Link href="/collections" className="text-body-sm text-gold-600 hover:underline flex items-center gap-1">
              View All on Storefront <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!loaded ? (
            <div className="py-12 text-center text-neutral-500">Loading catalog...</div>
          ) : customProducts.length === 0 ? (
            <div className="card p-10 text-center space-y-4 max-w-lg mx-auto">
              <Package className="h-12 w-12 text-neutral-300 mx-auto" />
              <h3 className="font-heading text-heading-md text-neutral-950">No Custom Products Added Yet</h3>
              <p className="text-body-sm text-neutral-600">
                You haven&apos;t published any custom products yet. Click below to add your first piece to the storefront.
              </p>
              <Link href="/admin/products/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Product
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card overflow-hidden hidden md:block">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-950/10 text-caption uppercase tracking-[0.12em] text-neutral-500">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 font-medium">Product</th>
                      <th scope="col" className="px-5 py-3.5 font-medium">Price (₹)</th>
                      <th scope="col" className="px-5 py-3.5 font-medium">Type</th>
                      <th scope="col" className="px-5 py-3.5 font-medium">Status</th>
                      <th scope="col" className="px-5 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-950/10">
                    {customProducts.map((product) => {
                      const image = product.featuredImage?.url || '/placeholder.svg';
                      const price = product.priceRange.minVariantPrice.amount;

                      return (
                        <tr key={product.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 relative rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                                <OptimizedImage src={image} alt={product.title} fill objectFit="cover" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-950">{product.title}</p>
                                <p className="text-caption text-neutral-400">/{product.handle}</p>
                                <p className="text-caption text-neutral-500">
                                  {product.variants.edges.length} variant(s) · {product.totalInventory} units
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-neutral-950">
                            {formatMoney(price, 'INR')}
                          </td>
                          <td className="px-5 py-3.5 text-neutral-600">{product.productType}</td>
                          <td className="px-5 py-3.5">
                            <span className="badge-gold">Active</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/products/${product.handle}`}
                                target="_blank"
                                className="h-10 w-10 inline-flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                                title="View product page"
                                aria-label={`View ${product.title} on storefront`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleArchive(product.id, product.title)}
                                className="h-10 w-10 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Archive product"
                                aria-label={`Archive ${product.title}`}
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <ul className="grid gap-3 md:hidden">
                {customProducts.map((product) => {
                  const image = product.featuredImage?.url || '/placeholder.svg';
                  const price = product.priceRange.minVariantPrice.amount;

                  return (
                    <li key={product.id} className="card p-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-16 h-[72px] relative rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                          <OptimizedImage src={image} alt={product.title} fill objectFit="cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-950 truncate">{product.title}</p>
                          <p className="text-caption text-neutral-400 truncate">/{product.handle}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-semibold text-neutral-950">{formatMoney(price, 'INR')}</span>
                            <span className="badge-gold">{product.productType}</span>
                          </div>
                          <p className="text-caption text-neutral-500 mt-1">
                            {product.variants.edges.length} variant(s) · {product.totalInventory} units
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Link
                            href={`/products/${product.handle}`}
                            target="_blank"
                            className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-neutral-950/10 text-neutral-600 hover:text-neutral-950 transition-colors"
                            title="View product page"
                            aria-label={`View ${product.title} on storefront`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleArchive(product.id, product.title)}
                            className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-neutral-950/10 text-neutral-400 hover:text-amber-600 transition-colors"
                            title="Archive product"
                            aria-label={`Archive ${product.title}`}
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
