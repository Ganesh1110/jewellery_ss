'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw, ExternalLink, Package, DollarSign, Plus, Minus, Layers, Pause, Play } from 'lucide-react';
import { fetchProducts } from '@/lib/shopify';
import { updateProductInventory, updateProductPrice, applyInventoryOverrides } from '@/lib/custom-products';
import { formatMoney } from '@/lib/utils';
import type { Product } from '@/types/shopify';
import { OptimizedImage } from '@/components/ui/Image';

type StockTab = 'all' | 'instock' | 'lowstock' | 'outofstock';

const STOCK_TABS: { key: StockTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'instock', label: 'In Stock' },
  { key: 'lowstock', label: 'Low Stock' },
  { key: 'outofstock', label: 'Out of Stock' },
];

export default function InventoryDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StockTab>('all');

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetchProducts(100);
      const rawProducts = res.edges.map((e) => e.node);
      const updated = rawProducts.map(applyInventoryOverrides);
      setProducts(updated);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleQuantityChange = (handle: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.handle !== handle) return p;
        const currentQty = p.totalInventory ?? 0;
        const newQty = Math.max(0, currentQty + delta);
        updateProductInventory(handle, newQty);
        return applyInventoryOverrides({ ...p, totalInventory: newQty, availableForSale: newQty > 0 });
      })
    );
  };

  const handleDirectQuantitySet = (handle: string, value: number) => {
    const newQty = Math.max(0, isNaN(value) ? 0 : value);
    updateProductInventory(handle, newQty);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.handle !== handle) return p;
        return applyInventoryOverrides({ ...p, totalInventory: newQty, availableForSale: newQty > 0 });
      })
    );
  };

  const handlePriceSet = (handle: string, value: number) => {
    const newPrice = Math.max(0, isNaN(value) ? 0 : value);
    updateProductPrice(handle, newPrice);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.handle !== handle) return p;
        return applyInventoryOverrides(p);
      })
    );
  };

  const handleToggleStockAvailability = (handle: string, currentAvailable: boolean) => {
    const newAvailable = !currentAvailable;
    const targetProduct = products.find((p) => p.handle === handle);
    const newQty = newAvailable ? Math.max(1, targetProduct?.totalInventory || 5) : 0;

    updateProductInventory(handle, newQty);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.handle !== handle) return p;
        return applyInventoryOverrides({ ...p, totalInventory: newQty, availableForSale: newAvailable });
      })
    );
  };

  // Metrics
  const totalUnits = products.reduce((acc, p) => acc + (p.totalInventory ?? 0), 0);
  const lowStockCount = products.filter((p) => (p.totalInventory ?? 0) > 0 && (p.totalInventory ?? 0) <= 3).length;
  const outOfStockCount = products.filter((p) => (p.totalInventory ?? 0) === 0 || !p.availableForSale).length;
  const totalValuation = products.reduce(
    (acc, p) => acc + (p.priceRange.minVariantPrice.amount * (p.totalInventory ?? 0)),
    0
  );

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productType.toLowerCase().includes(searchQuery.toLowerCase());

    const qty = p.totalInventory ?? 0;
    const isAvailable = p.availableForSale && qty > 0;

    if (!matchesSearch) return false;

    if (activeTab === 'instock') return isAvailable && qty > 3;
    if (activeTab === 'lowstock') return isAvailable && qty <= 3;
    if (activeTab === 'outofstock') return !isAvailable || qty === 0;

    return true;
  });

  const tabCounts: Record<StockTab, number> = {
    all: products.length,
    instock: products.length - lowStockCount - outOfStockCount,
    lowstock: lowStockCount,
    outofstock: outOfStockCount,
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream-50">
      {/* Header */}
      <header className="section-sm bg-white border-b border-neutral-950/10">
        <div className="container">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-neutral-950 mb-4 transition-colors min-h-[44px]">
            <ArrowLeft className="h-4 w-4" /> Back to Admin Dashboard
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <span className="overline text-gold-600 block mb-1">Store Owner Operations</span>
              <h1 className="font-heading text-display-md text-neutral-950">Inventory & Stock Control Center</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadInventory}
                className="btn-secondary text-body-sm inline-flex items-center gap-2"
                title="Refresh Stock Data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Stock Data
              </button>
              <Link href="/admin/products/new" className="btn-primary text-body-sm inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Overview Metrics Cards */}
      <section className="py-6 lg:py-8 bg-white border-b border-neutral-950/10" aria-label="Inventory metrics">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="card p-5 space-y-2 border-l-[3px] border-l-gold-500">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-caption uppercase font-medium">Total Items in Stock</span>
                <Layers className="h-5 w-5 text-gold-600" />
              </div>
              <p className="font-heading text-heading-lg lg:text-display-sm text-neutral-950 truncate">{totalUnits} units</p>
              <p className="text-caption text-neutral-400">Across {products.length} products</p>
            </div>

            <div className="card p-5 space-y-2 border-l-[3px] border-l-amber-500">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-caption uppercase font-medium">Low Stock Warning</span>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="font-heading text-heading-lg lg:text-display-sm text-neutral-950 truncate">{lowStockCount} items</p>
              <p className="text-caption text-amber-600 font-medium">≤ 3 units remaining</p>
            </div>

            <div className="card p-5 space-y-2 border-l-[3px] border-l-red-500">
              <div className="flex items-center justify-between text-red-600">
                <span className="text-caption uppercase font-medium">Out of Stock</span>
                <XCircle className="h-5 w-5" />
              </div>
              <p className="font-heading text-heading-lg lg:text-display-sm text-neutral-950 truncate">{outOfStockCount} items</p>
              <p className="text-caption text-red-600 font-medium">Displays &ldquo;Sold Out&rdquo; on PDP</p>
            </div>

            <div className="card p-5 space-y-2 border-l-[3px] border-l-emerald-500">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-caption uppercase font-medium">Total Inventory Value</span>
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="font-heading text-heading-lg lg:text-display-sm text-neutral-950 truncate">{formatMoney(totalValuation, 'INR')}</p>
              <p className="text-caption text-emerald-600 font-medium">Current stock value</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Inventory Controls */}
      <section className="section" aria-label="Inventory table and filters">
        <div className="container space-y-6">
          {/* Controls Bar: Tabs & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex bg-white p-1 rounded-xl border border-neutral-950/10 w-full lg:w-auto overflow-x-auto" role="tablist" aria-label="Stock filters">
              {STOCK_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const count = tabCounts[tab.key];
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 h-11 px-4 text-body-sm font-medium rounded-lg whitespace-nowrap transition-all flex-1 lg:flex-none justify-center ${
                      isActive ? 'bg-neutral-950 text-cream-50' : 'text-neutral-600 hover:text-neutral-950'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-caption tabular-nums ${isActive ? 'text-cream-50/70' : 'text-neutral-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative w-full lg:w-80">
              <Search className="h-4 w-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory by title or SKU..."
                className="input pl-10 text-body-sm min-h-[48px]"
              />
            </div>
          </div>

          {/* Inventory Table */}
          {loading ? (
            <div className="py-16 text-center text-neutral-500">Loading stock levels...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="card p-12 text-center space-y-3 max-w-md mx-auto">
              <Package className="h-10 w-10 text-neutral-300 mx-auto" />
              <h3 className="font-heading text-heading-md text-neutral-950">No Inventory Items Found</h3>
              <p className="text-body-sm text-neutral-500">Try adjusting your search query or tab filter.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const image = product.featuredImage?.url || '/placeholder.svg';
              const qty = product.totalInventory ?? 0;
              const price = product.priceRange.minVariantPrice.amount;
              const isAvailable = product.availableForSale && qty > 0;

              return (
                <div key={product.id} className="card p-4 sm:p-5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4">
                  {/* Product Info */}
                  <div className="flex items-center gap-3.5 sm:col-span-5 xl:col-span-4">
                    <div className="w-14 h-14 rounded bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-950/10">
                      <OptimizedImage src={image} alt={product.title} width={56} height={56} objectFit="cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-950 line-clamp-1">{product.title}</p>
                      <p className="text-caption text-neutral-400 uppercase tracking-wider">SKU: {product.handle.slice(0, 16).toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mt-3 sm:mt-0 sm:col-span-2 text-body-sm">
                    <span className="sm:hidden text-caption text-neutral-400 mr-1">Category:</span>
                    <span className="text-neutral-600 font-medium">{product.productType || 'Jewelry'}</span>
                  </div>

                  {/* Price Editor */}
                  <div className="mt-3 sm:mt-0 sm:col-span-2">
                    <label className="sm:hidden text-caption text-neutral-400 block mb-1">Unit Price</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => handlePriceSet(product.handle, Number(e.target.value))}
                        className="input text-body-sm font-semibold text-neutral-950 text-center min-w-0 w-full"
                        aria-label={`Price for ${product.title}`}
                      />
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="mt-3 sm:mt-0 sm:col-span-3 xl:col-span-2">
                    <label className="sm:hidden text-caption text-neutral-400 block mb-1">Stock Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product.handle, -1)}
                        className="h-11 w-11 flex-shrink-0 rounded-lg border border-neutral-950/10 text-neutral-700 hover:bg-neutral-100 transition-colors flex items-center justify-center"
                        title={`Decrease stock quantity for ${product.title}`}
                        aria-label={`Decrease stock quantity for ${product.title}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleDirectQuantitySet(product.handle, Number(e.target.value))}
                        className="input text-center font-semibold text-neutral-950 min-w-0 w-full"
                        aria-label={`Stock quantity for ${product.title}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product.handle, 1)}
                        className="h-11 w-11 flex-shrink-0 rounded-lg border border-neutral-950/10 text-neutral-700 hover:bg-neutral-100 transition-colors flex items-center justify-center"
                        title={`Increase stock quantity for ${product.title}`}
                        aria-label={`Increase stock quantity for ${product.title}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 sm:mt-0 sm:col-span-12 xl:col-span-1 flex items-center justify-between sm:justify-start gap-2">
                    {!isAvailable || qty === 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 h-9 rounded-full text-caption font-semibold bg-red-100 text-red-700 uppercase tracking-wider">
                        <XCircle className="h-3.5 w-3.5" /> Sold Out
                      </span>
                    ) : qty <= 3 ? (
                      <span className="inline-flex items-center gap-1 px-3 h-9 rounded-full text-caption font-semibold bg-amber-100 text-amber-800 uppercase tracking-wider">
                        <AlertTriangle className="h-3.5 w-3.5" /> Low ({qty})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 h-9 rounded-full text-caption font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        <CheckCircle2 className="h-3.5 w-3.5" /> In Stock ({qty})
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 sm:mt-0 sm:col-span-12 xl:col-span-1 xl:-ml-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStockAvailability(product.handle, isAvailable)}
                      className={`inline-flex items-center gap-1.5 px-3 h-11 text-caption font-medium rounded-lg border transition-colors ${
                        isAvailable
                          ? 'border-neutral-950/10 text-neutral-700 hover:bg-neutral-100'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isAvailable ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {isAvailable ? 'Mark Sold Out' : 'Mark In Stock'}
                    </button>

                    <Link
                      href={`/products/${product.handle}`}
                      target="_blank"
                      className="h-11 w-11 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                      title="View live product page"
                      aria-label={`View ${product.title}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}