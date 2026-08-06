'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Package, Trash2, ExternalLink, ShieldCheck, Tag, DollarSign, Layers } from 'lucide-react';
import { getCustomProducts, deleteCustomProduct } from '@/lib/custom-products';
import { formatMoney } from '@/lib/utils';
import type { Product } from '@/types/shopify';
import { OptimizedImage } from '@/components/ui/Image';

export default function AdminDashboardPage() {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCustomProducts(getCustomProducts());
    setLoaded(true);
  }, []);

  const handleDelete = (handle: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteCustomProduct(handle);
      setCustomProducts(getCustomProducts());
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
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-caption uppercase text-neutral-500">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">Price (₹)</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {customProducts.map((product) => {
                      const image = product.featuredImage?.url || '/placeholder.svg';
                      const price = product.priceRange.minVariantPrice.amount;

                      return (
                        <tr key={product.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 relative rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                                <OptimizedImage src={image} alt={product.title} fill objectFit="cover" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-950">{product.title}</p>
                                <p className="text-caption text-neutral-400">/{product.handle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-neutral-950">
                            {formatMoney(price, 'INR')}
                          </td>
                          <td className="p-4 text-neutral-600">{product.productType}</td>
                          <td className="p-4">
                            <span className="badge-gold">Active</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <Link
                                href={`/products/${product.handle}`}
                                target="_blank"
                                className="text-neutral-500 hover:text-neutral-950 transition-colors p-1"
                                title="View product page"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(product.handle, product.title)}
                                className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                                title="Delete product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
