'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw, ExternalLink, Package, DollarSign, Plus, Layers, History, Pencil, Archive, RotateCcw, ChevronDown, ChevronRight, X } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types/shopify';
import type { InventoryMovementView } from '@/types/admin';
import { OptimizedImage } from '@/components/ui/Image';

type StockTab = 'all' | 'instock' | 'lowstock' | 'outofstock';
type MovementType = 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE';

const STOCK_TABS: { key: StockTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'instock', label: 'In Stock' },
  { key: 'lowstock', label: 'Low Stock' },
  { key: 'outofstock', label: 'Out of Stock' },
];

const MOVEMENT_META: Record<MovementType, { label: string; hint: string }> = {
  RESTOCK: { label: 'Restock', hint: 'New stock received — positive quantity.' },
  ADJUSTMENT: { label: 'Adjust', hint: 'Manual correction — positive or negative quantity.' },
  DAMAGE: { label: 'Damage', hint: 'Units written off — positive quantity is removed from stock.' },
};

function variantStatus(v: ProductVariant) {
  if (!v.availableForSale || !v.quantityAvailable) return { label: 'Sold Out', tone: 'red' as const };
  if (v.quantityAvailable <= v.lowStockThreshold) return { label: `Low (${v.quantityAvailable})`, tone: 'amber' as const };
  return { label: `In Stock (${v.quantityAvailable})`, tone: 'emerald' as const };
}

function variantTitle(v: ProductVariant): string {
  const parts = v.selectedOptions.filter((o) => o.value).map((o) => o.value);
  return parts.length ? parts.join(' / ') : v.title;
}

const STATUS_TONE_CLASS = {
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-800',
  emerald: 'bg-emerald-100 text-emerald-800',
};

export default function InventoryDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StockTab>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [movementDialog, setMovementDialog] = useState<{ variant: ProductVariant; product: Product; type: MovementType } | null>(null);
  const [editDialog, setEditDialog] = useState<{ variant: ProductVariant; product: Product } | null>(null);
  const [historyFor, setHistoryFor] = useState<{ variant: ProductVariant; product: Product } | null>(null);
  const [historyRows, setHistoryRows] = useState<InventoryMovementView[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products?first=100&includeArchived=1');
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      const list = data.edges.map((e: { node: Product }) => e.node) as Product[];
      setProducts(list);
      setExpanded(new Set(list.map((p) => p.id)));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadArchived = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const res = await fetch('/api/admin/products?archived=1&first=100');
      if (!res.ok) throw new Error('Failed to load archived products');
      const data = await res.json();
      setArchivedProducts(data.edges.map((e: { node: Product }) => e.node) as Product[]);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
    loadArchived();
  }, [loadInventory, loadArchived]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitMovement = async (variant: ProductVariant, type: MovementType, quantity: number, note: string) => {
    const res = await fetch('/api/admin/inventory/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId: variant.id, type, quantity, note }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to record movement');
    return data;
  };

  const archiveVariant = async (variant: ProductVariant) => {
    const res = await fetch(`/api/admin/variants/${encodeURIComponent(variant.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    });
    if (!res.ok) throw new Error('Failed to archive variant');
    return res.json();
  };

  const restoreVariant = async (variant: ProductVariant) => {
    const res = await fetch(`/api/admin/variants/${encodeURIComponent(variant.id)}/restore`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to restore variant');
    return res.json();
  };

  // Metrics (live variants only)
  const allLiveVariants = products.flatMap((p) => p.variants.edges.map((e) => ({ variant: e.node, product: p })));
  const totalUnits = products.reduce((acc, p) => acc + p.totalInventory, 0);
  const lowStockCount = allLiveVariants.filter(({ variant }) => (variant.quantityAvailable ?? 0) > 0 && (variant.quantityAvailable ?? 0) <= variant.lowStockThreshold).length;
  const outOfStockCount = allLiveVariants.filter(({ variant }) => (variant.quantityAvailable ?? 0) === 0 || !variant.availableForSale).length;
  const totalValuation = allLiveVariants.reduce((acc, { variant }) => acc + variant.price.amount * (variant.quantityAvailable ?? 0), 0);

  // Filtering at variant level
  const q = searchQuery.trim().toLowerCase();
  const matchesVariant = (variant: ProductVariant) => {
    if (variant.archived) return false;
    const qty = variant.quantityAvailable ?? 0;
    const isAvailable = variant.availableForSale && qty > 0;
    if (activeTab === 'instock') return isAvailable && qty > variant.lowStockThreshold;
    if (activeTab === 'lowstock') return isAvailable && qty > 0 && qty <= variant.lowStockThreshold;
    if (activeTab === 'outofstock') return !isAvailable || qty === 0;
    return true;
  };

  const filteredProducts = products
    .map((p) => {
      const productMatches = !q || `${p.title} ${p.handle} ${p.productType}`.toLowerCase().includes(q);
      if (!productMatches) return { product: p, variants: [] as ProductVariant[] };
      const variants = p.variants.edges.map((e) => e.node).filter((v) => {
        if (!matchesVariant(v)) return false;
        if (!q) return true;
        return `${variantTitle(v)} ${v.sku ?? ''} ${v.barcode ?? ''}`.toLowerCase().includes(q);
      });
      return { product: p, variants };
    })
    .filter(({ variants }) => variants.length > 0);

  const tabCounts: Record<StockTab, number> = {
    all: allLiveVariants.length,
    instock: Math.max(0, allLiveVariants.length - lowStockCount - outOfStockCount),
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
                type="button"
                onClick={() => { loadInventory(); loadArchived(); }}
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
              <p className="text-caption text-neutral-400">Across {allLiveVariants.length} variants</p>
            </div>

            <div className="card p-5 space-y-2 border-l-[3px] border-l-amber-500">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-caption uppercase font-medium">Low Stock Warning</span>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="font-heading text-heading-lg lg:text-display-sm text-neutral-950 truncate">{lowStockCount} variants</p>
              <p className="text-caption text-amber-600 font-medium">At or below variant threshold</p>
            </div>

            <div className="card p-5 space-y-2 border-l-[3px] border-l-red-500">
              <div className="flex items-center justify-between text-red-600">
                <span className="text-caption uppercase font-medium">Out of Stock</span>
                <XCircle className="h-5 w-5" />
              </div>
              <p className="font-heading text-heading-lg lg:text-display-sm text-neutral-950 truncate">{outOfStockCount} variants</p>
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
            <div className="flex bg-white p-1 rounded-xl border border-neutral-950/10 w-full lg:w-auto overflow-x-auto" role="tablist" aria-label="Stock filters">
              {STOCK_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const count = tabCounts[tab.key];
                return (
                  <button
                    key={tab.key}
                    type="button"
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
            <div className="space-y-4">
              {filteredProducts.map(({ product, variants }) => {
                const image = product.featuredImage?.url || '/placeholder.svg';
                const isOpen = expanded.has(product.id);
                return (
                  <div key={product.id} className="card overflow-hidden">
                    {/* Product header row */}
                    <div className="p-4 sm:p-5 flex items-center gap-3.5 cursor-pointer select-none" onClick={() => toggleExpanded(product.id)}>
                      <button
                        type="button"
                        className="h-9 w-9 flex-shrink-0 rounded-lg border border-neutral-950/10 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        aria-label={isOpen ? `Collapse ${product.title}` : `Expand ${product.title}`}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <div className="w-14 h-14 rounded bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-950/10">
                        <OptimizedImage src={image} alt={product.title} width={56} height={56} objectFit="cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-950 line-clamp-1">{product.title}</p>
                        <p className="text-caption text-neutral-400 uppercase tracking-wider">
                          {variants.length} variant(s) · {product.totalInventory} units
                        </p>
                      </div>
                      <Link
                        href={`/products/${product.handle}`}
                        target="_blank"
                        className="h-11 w-11 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                        title="View live product page"
                        aria-label={`View ${product.title}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* Variant sub-table */}
                    {isOpen && (
                      <div className="border-t border-neutral-950/10">
                        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 bg-neutral-50 text-caption uppercase tracking-wider text-neutral-400 font-medium">
                          <div className="col-span-3">Variant</div>
                          <div className="col-span-2">SKU / Barcode</div>
                          <div className="col-span-2">Price</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-3">Actions</div>
                        </div>
                        {variants.map((variant) => (
                          <div key={variant.id} className="px-4 sm:px-5 py-3 border-t border-neutral-950/5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 md:items-center">
                            <div className="md:col-span-3">
                              <p className="font-medium text-neutral-950 text-body-sm line-clamp-1">{variantTitle(variant)}</p>
                              {variant.archived && (
                                <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-caption font-semibold bg-neutral-200 text-neutral-600 uppercase tracking-wider mt-1">
                                  <Archive className="h-3 w-3" /> Archived
                                </span>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-caption text-neutral-600 font-medium">{variant.sku || '—'}</p>
                              <p className="text-caption text-neutral-400">{variant.barcode || '—'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-body-sm font-semibold text-neutral-950 tabular-nums">{formatMoney(variant.price.amount, 'INR')}</p>
                              {variant.compareAtPrice && (
                                <p className="text-caption text-neutral-400 line-through tabular-nums">{formatMoney(variant.compareAtPrice.amount, 'INR')}</p>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              {variant.archived ? (
                                <span className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-caption font-semibold bg-neutral-200 text-neutral-500 uppercase tracking-wider">
                                  Archived
                                </span>
                              ) : (
                                (() => {
                                  const s = variantStatus(variant);
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-3 h-8 rounded-full text-caption font-semibold uppercase tracking-wider ${STATUS_TONE_CLASS[s.tone]}`}>
                                      <XCircle className="h-3 w-3" /> {s.label}
                                    </span>
                                  );
                                })()
                              )}
                            </div>
                            <div className="md:col-span-3 flex flex-wrap items-center gap-1.5">
                              {variant.archived ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    restoreVariant(variant)
                                      .then(() => { loadInventory(); showToast(`Restored ${variantTitle(variant)}`); })
                                      .catch((e) => showToast(e.message))
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setMovementDialog({ variant, product, type: 'RESTOCK' })}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-neutral-950/10 text-neutral-700 hover:bg-neutral-100 transition-colors"
                                    title="Add stock"
                                  >
                                    <Plus className="h-3.5 w-3.5" /> Restock
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMovementDialog({ variant, product, type: 'ADJUSTMENT' })}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-neutral-950/10 text-neutral-700 hover:bg-neutral-100 transition-colors"
                                    title="Correct stock level"
                                  >
                                    <Layers className="h-3.5 w-3.5" /> Adjust
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMovementDialog({ variant, product, type: 'DAMAGE' })}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                                    title="Write off damaged units"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Damage
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHistoryRows([]);
                                      setHistoryFor({ variant, product });
                                      setHistoryLoading(true);
                                      fetch(`/api/admin/variants/${encodeURIComponent(variant.id)}/movements`)
                                        .then((r) => r.json())
                                        .then((rows: InventoryMovementView[]) => setHistoryRows(rows))
                                        .catch(() => showToast('Failed to load history'))
                                        .finally(() => setHistoryLoading(false));
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-neutral-950/10 text-neutral-700 hover:bg-neutral-100 transition-colors"
                                    title="View movement history"
                                  >
                                    <History className="h-3.5 w-3.5" /> History
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditDialog({ variant, product })}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-neutral-950/10 text-neutral-700 hover:bg-neutral-100 transition-colors"
                                    title="Edit variant details"
                                  >
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      archiveVariant(variant)
                                        .then(() => { loadInventory(); showToast(`Archived ${variantTitle(variant)}`); })
                                        .catch((e) => showToast(e.message))
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-neutral-950/10 text-neutral-700 hover:bg-neutral-100 transition-colors"
                                    title="Archive this variant"
                                  >
                                    <Archive className="h-3.5 w-3.5" /> Archive
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Archived products section */}
          <div className="pt-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-heading text-heading-md text-neutral-950">Archived Products</h2>
                <p className="text-body-sm text-neutral-500">Products you have archived. Restore them to make them available again.</p>
              </div>
              <button
                type="button"
                onClick={loadArchived}
                className="btn-secondary text-body-sm inline-flex items-center gap-2"
                title="Refresh archived products"
              >
                <RefreshCw className={`h-4 w-4 ${archivedLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {archivedLoading ? (
              <div className="py-8 text-center text-neutral-500">Loading archived products...</div>
            ) : archivedProducts.length === 0 ? (
              <div className="card p-8 text-center space-y-2">
                <Archive className="h-8 w-8 text-neutral-300 mx-auto" />
                <p className="text-body-sm text-neutral-500">No archived products.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedProducts.map((product) => {
                  const variants = product.variants.edges.map((e) => e.node);
                  return (
                    <div key={product.id} className="card overflow-hidden opacity-90">
                      <div className="p-4 sm:p-5 flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-950/10">
                          <OptimizedImage src={product.featuredImage?.url || '/placeholder.svg'} alt={product.title} width={56} height={56} objectFit="cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-950 line-clamp-1">{product.title}</p>
                          <p className="text-caption text-neutral-400 uppercase tracking-wider">
                            {variants.filter((v) => v.archived).length} archived variant(s)
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-3 h-9 rounded-full text-caption font-semibold bg-neutral-200 text-neutral-600 uppercase tracking-wider">
                          <Archive className="h-3.5 w-3.5" /> Archived
                        </span>
                      </div>
                      {variants.length > 0 && (
                        <div className="border-t border-neutral-950/10">
                          {variants.map((variant) => (
                            <div key={variant.id} className="px-4 sm:px-5 py-3 border-t border-neutral-950/5 flex flex-wrap items-center gap-2 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-neutral-950 text-body-sm line-clamp-1">{variantTitle(variant)}</p>
                                <p className="text-caption text-neutral-400">{variant.sku || '—'} · {formatMoney(variant.price.amount, 'INR')}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  restoreVariant(variant)
                                    .then(() => { loadArchived(); loadInventory(); showToast(`Restored ${variantTitle(variant)}`); })
                                    .catch((e) => showToast(e.message))
                                }
                                className="inline-flex items-center gap-1.5 px-3 h-9 text-caption font-medium rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Restore
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Movement Dialog */}
      {movementDialog && (
        <MovementDialog
          meta={MOVEMENT_META[movementDialog.type]}
          variant={movementDialog.variant}
          product={movementDialog.product}
          onClose={() => setMovementDialog(null)}
          onSubmit={async (quantity, note) => {
            await submitMovement(movementDialog.variant, movementDialog.type, quantity, note);
            await loadInventory();
            showToast(`${MOVEMENT_META[movementDialog.type].label} recorded`);
          }}
        />
      )}

      {/* Edit Dialog */}
      {editDialog && (
        <EditDialog
          variant={editDialog.variant}
          product={editDialog.product}
          onClose={() => setEditDialog(null)}
          onSaved={async () => { await loadInventory(); showToast('Variant updated'); }}
          showToast={showToast}
        />
      )}

      {/* History Dialog */}
      {historyFor && (
        <HistoryDialog
          variant={historyFor.variant}
          product={historyFor.product}
          rows={historyRows}
          loading={historyLoading}
          onClose={() => setHistoryFor(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70]">
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-950 text-cream-50 text-body-sm shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function DialogShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-neutral-950/10">
          <div>
            <h3 className="font-heading text-heading-md text-neutral-950">{title}</h3>
            {subtitle && <p className="text-caption text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 flex-shrink-0 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function MovementDialog({ meta, variant, product, onClose, onSubmit }: {
  meta: { label: string; hint: string };
  variant: ProductVariant;
  product: Product;
  onClose: () => void;
  onSubmit: (quantity: number, note: string) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState<number>(meta.label === 'Restock' ? 1 : 0);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!Number.isInteger(quantity) || quantity === 0) {
      setError('Quantity must be a non-zero integer.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(quantity, note);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record movement');
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      title={`${meta.label} — ${variantTitle(variant)}`}
      subtitle={`${product.title} · ${variant.sku || 'no SKU'} · Current stock: ${variant.quantityAvailable ?? 0}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-body-sm text-neutral-600 bg-neutral-50 border border-neutral-950/10 rounded-lg px-3 py-2.5">{meta.hint}</p>
        <div>
          <label className="block text-caption uppercase tracking-wider font-medium text-neutral-500 mb-1.5">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input text-body-sm font-semibold text-neutral-950"
            placeholder={meta.label === 'Adjust' ? 'e.g. 5 or -3' : 'e.g. 10'}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-caption uppercase tracking-wider font-medium text-neutral-500 mb-1.5">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input text-body-sm"
            placeholder="e.g. New batch from workshop"
          />
        </div>
        {error && <p className="text-body-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary text-body-sm">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary text-body-sm">
            {submitting ? 'Saving...' : `Save ${meta.label}`}
          </button>
        </div>
      </div>
    </DialogShell>
  );
}

function EditDialog({ variant, product, onClose, onSaved, showToast }: {
  variant: ProductVariant;
  product: Product;
  onClose: () => void;
  onSaved: () => Promise<void>;
  showToast: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    sku: variant.sku ?? '',
    barcode: variant.barcode ?? '',
    price: variant.price.amount,
    compareAtPrice: variant.compareAtPrice?.amount ?? null as number | null,
    lowStockThreshold: variant.lowStockThreshold,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (form.price < 0 || form.compareAtPrice !== null && form.compareAtPrice < 0) {
      setError('Prices cannot be negative.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/variants/${encodeURIComponent(variant.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: form.sku.trim() || null,
          barcode: form.barcode.trim() || null,
          price: form.price,
          compareAtPrice: form.compareAtPrice,
          lowStockThreshold: form.lowStockThreshold,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update variant');
      await onSaved();
      onClose();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
        showToast(e.message);
      }
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      title={`Edit — ${variantTitle(variant)}`}
      subtitle={`${product.title} · ${variant.sku || 'no SKU'}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-caption uppercase tracking-wider font-medium text-neutral-500 mb-1.5">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              className="input text-body-sm"
              placeholder="e.g. SSR-GLD-NAG-7"
            />
          </div>
          <div>
            <label className="block text-caption uppercase tracking-wider font-medium text-neutral-500 mb-1.5">Barcode</label>
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => set('barcode', e.target.value)}
              className="input text-body-sm"
              placeholder="e.g. 8901234567890"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-caption uppercase tracking-wider font-medium text-neutral-500 mb-1.5">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
              className="input text-body-sm font-semibold text-neutral-950"
            />
          </div>
          <div>
            <label className="block text-caption uppercase tracking-wider font-medium text-neutral-500 mb-1.5">Compare-at Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.compareAtPrice ?? ''}
              onChange={(e) => set('compareAtPrice', e.target.value === '' ? null : Number(e.target.value))}
              className="input text-body-sm"
              placeholder="Optional"
            />
          </div>
        </div>
        <div>
          <label className="block text-caption uppercase tracking-wider font-medium text-neutral-500 mb-1.5">Low Stock Threshold</label>
          <input
            type="number"
            min="1"
            value={form.lowStockThreshold}
            onChange={(e) => set('lowStockThreshold', Number(e.target.value))}
            className="input text-body-sm"
          />
          <p className="text-caption text-neutral-400 mt-1">Variant shows a low-stock warning at or below this count.</p>
        </div>
        {error && <p className="text-body-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary text-body-sm">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary text-body-sm">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </DialogShell>
  );
}

function HistoryDialog({ variant, product, rows, loading, onClose }: {
  variant: ProductVariant;
  product: Product;
  rows: InventoryMovementView[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <DialogShell
      title={`History — ${variantTitle(variant)}`}
      subtitle={`${product.title} · ${variant.sku || 'no SKU'}`}
      onClose={onClose}
    >
      {loading ? (
        <div className="py-10 text-center text-neutral-500">Loading movements...</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-neutral-500">No movements recorded for this variant yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-caption uppercase tracking-wider text-neutral-400 border-b border-neutral-950/10">
                <th className="text-left py-2 pr-3 font-medium">Type</th>
                <th className="text-right py-2 pr-3 font-medium">Qty</th>
                <th className="text-left py-2 pr-3 font-medium">Note</th>
                <th className="text-left py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const inflow = row.type === 'RESTOCK' || row.quantity > 0;
                return (
                  <tr key={row.id} className="border-b border-neutral-950/5">
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center px-2 h-6 rounded-full text-caption font-semibold uppercase tracking-wider ${
                        row.type === 'RESTOCK' ? 'bg-emerald-100 text-emerald-800' : row.type === 'DAMAGE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.type}
                      </span>
                      {row.reference && row.reference !== 'admin' && <span className="ml-1.5 text-caption text-neutral-400">({row.reference})</span>}
                    </td>
                    <td className={`py-2.5 pr-3 text-right font-semibold tabular-nums ${inflow ? 'text-emerald-700' : 'text-red-600'}`}>
                      {row.quantity > 0 ? '+' : ''}{row.quantity}
                    </td>
                    <td className="py-2.5 pr-3 text-neutral-600 max-w-[160px] truncate">{row.note || '—'}</td>
                    <td className="py-2.5 text-neutral-400 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DialogShell>
  );
}