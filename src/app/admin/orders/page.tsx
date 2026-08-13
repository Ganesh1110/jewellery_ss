'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, PackageOpen, Search, ExternalLink, CheckCircle2 } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/Image';
import type { StoredOrder } from '@/types/admin';

const STATUS_STYLES: Record<string, string> = {
  Fulfilled: 'bg-emerald-100 text-emerald-800',
  Processing: 'bg-amber-100 text-amber-800',
  'Shipped': 'bg-blue-100 text-blue-800',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: StoredOrder[]) => setOrders(data))
      .catch(() => setOrders([]));
  }, []);

  const statuses = ['All', ...Array.from(new Set(orders.map((o) => o.status)))];

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.orderNumber.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-cream-50">
      <header className="section-sm bg-white border-b border-neutral-950/10">
        <div className="container">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-neutral-950 mb-4 transition-colors min-h-[44px]">
            <ArrowLeft className="h-4 w-4" /> Back to Admin Dashboard
          </Link>
          <span className="overline text-gold-600 block mb-1">Store Owner Operations</span>
          <h1 className="font-heading text-display-md text-neutral-950 mb-1">Order Management</h1>
          <p className="text-body-sm text-neutral-600">
            {orders.length} order{orders.length !== 1 ? 's' : ''} captured from the storefront checkout handoff.
          </p>
        </div>
      </header>

      <section className="section" aria-label="Orders list">
        <div className="container space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex bg-white p-1 rounded-xl border border-neutral-950/10 w-full lg:w-auto overflow-x-auto" role="tablist" aria-label="Order status filters">
              {statuses.map((status) => (
                <button
                  key={status}
                  role="tab"
                  aria-selected={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex items-center gap-2 h-11 px-4 text-body-sm font-medium rounded-lg whitespace-nowrap transition-all flex-1 lg:flex-none justify-center ${
                    statusFilter === status ? 'bg-neutral-950 text-cream-50' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="h-4 w-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order no., customer, email..."
                className="input pl-10 text-body-sm min-h-[48px]"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-12 text-center space-y-3 max-w-md mx-auto">
              <PackageOpen className="h-10 w-10 text-neutral-300 mx-auto" />
              <h2 className="font-heading text-heading-md text-neutral-950">No Orders Found</h2>
              <p className="text-body-sm text-neutral-500">Orders appear here once a customer checks out.</p>
            </div>
          ) : (
            <ul className="grid lg:grid-cols-2 gap-4">
              {filtered.map((order) => (
                <li key={order.orderNumber} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-neutral-100 border border-neutral-950/10 flex items-center justify-center text-neutral-500">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-950">{order.orderNumber}</p>
                        <p className="text-caption text-neutral-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 h-9 rounded-full text-caption font-semibold uppercase tracking-wider ${STATUS_STYLES[order.status] || 'bg-neutral-100 text-neutral-700'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {order.lineItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                          <OptimizedImage src={item.image} alt={item.title} width={48} height={48} objectFit="cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium text-neutral-950 truncate">
                            {item.title}
                            {item.variantTitle && item.variantTitle !== 'Default Title' ? ` — ${item.variantTitle}` : ''}
                          </p>
                          <p className="text-caption text-neutral-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-body-sm text-neutral-500 tabular-nums">
                          {formatMoney((Number(order.total) / order.lineItems.reduce((a, b) => a + b.quantity, 0)) * item.quantity, order.currencyCode as 'INR' | 'USD')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-950/10">
                    <div>
                      <p className="text-caption text-neutral-500">{order.name}</p>
                      <p className="text-body-sm font-semibold text-neutral-950">{formatMoney(order.total, order.currencyCode as 'INR' | 'USD')}</p>
                    </div>
                    <Link
                      href="/admin/settings"
                      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-neutral-950/10 text-body-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      Manage <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}