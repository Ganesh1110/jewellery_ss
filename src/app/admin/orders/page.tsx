'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, PackageOpen, Search, CheckCircle2, X, Truck, Clock, Check, MapPin } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/Image';
import type { StoredOrder } from '@/types/admin';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

const STATUS_STYLES: Record<string, string> = {
  Fulfilled: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Processing: 'bg-amber-100 text-amber-800 border-amber-200',
  Shipped: 'bg-blue-100 text-blue-800 border-blue-200',
};

const AVAILABLE_STATUSES = ['Processing', 'Shipped', 'Fulfilled'] as const;

function extractOrderPincode(order: StoredOrder | null): string {
  if (!order) return '400001';
  if (order.address?.pincode && /^\d{6}$/.test(order.address.pincode.trim())) {
    return order.address.pincode.trim();
  }
  if (typeof order.address === 'string') {
    const m = (order.address as string).match(/\b\d{6}\b/);
    if (m) return m[0];
  }
  return '400001';
}

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<StoredOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [inspectPincode, setInspectPincode] = useState<string>('400001');
  const [courierInfo, setCourierInfo] = useState<{
    serviceable: boolean;
    couriers?: string[];
    estimatedDays?: string;
    message?: string;
    pincode?: string;
  } | null>(null);

  const fetchCourierInfo = (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return;
    fetch(`/api/shipping/serviceability?pincode=${encodeURIComponent(pin)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCourierInfo(data))
      .catch(() => setCourierInfo(null));
  };

  useEffect(() => {
    if (selectedOrder) {
      const pin = extractOrderPincode(selectedOrder);
      setInspectPincode(pin);
      fetchCourierInfo(pin);
    } else {
      setCourierInfo(null);
    }
  }, [selectedOrder]);

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

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      const updatedOrder = (await res.json()) as StoredOrder;
      
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      showToast(`Order ${updatedOrder.orderNumber} updated to ${newStatus}`, 'success');
    } catch {
      showToast('Could not update order status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

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
                <li key={order.orderNumber} className="card p-5 flex flex-col justify-between">
                  <div>
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
                      <span className={`inline-flex items-center gap-1 px-3 h-8 rounded-full text-caption font-semibold uppercase tracking-wider border ${STATUS_STYLES[order.status] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {order.lineItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                            <OptimizedImage src={item.image} alt={item.title} width={48} height={48} objectFit="cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-medium text-neutral-950 truncate">
                              {item.title}
                              {item.variantTitle && item.variantTitle !== 'Default Title' ? ` — ${item.variantTitle}` : ''}
                            </p>
                            <p className="text-caption text-neutral-500">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-body-sm text-neutral-500 tabular-nums font-medium">
                            {formatMoney((Number(order.total) / order.lineItems.reduce((a, b) => a + b.quantity, 0)) * item.quantity, order.currencyCode as 'INR' | 'USD')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-950/10">
                    <div>
                      <p className="text-caption font-medium text-neutral-900">{order.name}</p>
                      {order.address?.city && (
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gold-600" />
                          <span>{order.address.city} ({order.address.pincode})</span>
                        </p>
                      )}
                      <p className="text-body-sm font-semibold text-neutral-950 mt-0.5">{formatMoney(order.total, order.currencyCode as 'INR' | 'USD')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="btn-primary text-body-sm px-4 py-2 min-h-[40px] font-medium"
                    >
                      Manage Order
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Order Management Dialog */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => !updatingStatus && setSelectedOrder(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-neutral-200 z-10 space-y-6 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              disabled={updatingStatus}
              className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header info */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-display-xs text-neutral-950">
                  Order {selectedOrder.orderNumber}
                </h2>
                <span className={`inline-flex items-center gap-1 px-3 h-7 rounded-full text-caption font-semibold uppercase tracking-wider border ${STATUS_STYLES[selectedOrder.status] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <p className="text-body-sm text-neutral-500">
                Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Customer Contact & Delivery Address */}
            <div className="card p-4 bg-cream-50/80 border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="overline text-gold-600 block">Customer & Shipping Address</span>
                {selectedOrder.phone && (
                  <span className="text-caption font-medium text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    📞 {selectedOrder.phone}
                  </span>
                )}
              </div>
              <div className="text-body-sm space-y-1">
                <p className="font-semibold text-neutral-950">{selectedOrder.name}</p>
                {selectedOrder.email && <p className="text-neutral-600">{selectedOrder.email}</p>}
                {selectedOrder.address ? (
                  <div className="pt-2 text-caption text-neutral-700 space-y-0.5 border-t border-neutral-200/60">
                    <p className="font-medium text-neutral-900">{selectedOrder.address.addressLine}</p>
                    <p>{selectedOrder.address.city}, {selectedOrder.address.state} — <strong className="text-neutral-950 font-semibold">{selectedOrder.address.pincode}</strong></p>
                  </div>
                ) : (
                  <p className="text-caption text-neutral-400 italic pt-1">No detailed address captured (Walk-in or standard checkout)</p>
                )}
              </div>
            </div>

            {/* Courier Serviceability & Logistics Inspection (DTDC & Professional Courier) */}
            <div className="card p-4 bg-white border-gold-200/80 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-950 font-heading text-body-sm font-semibold">
                  <Truck className="h-4 w-4 text-gold-600" />
                  <span>Courier Availability & Dispatch Status</span>
                </div>
                <span className="text-caption font-semibold px-2 py-0.5 bg-gold-100 text-gold-900 rounded border border-gold-300">
                  PIN: {inspectPincode}
                </span>
              </div>

              {/* Pincode Test Input for Admin */}
              <div className="flex items-center gap-2 pt-1">
                <label className="text-caption font-medium text-neutral-600 whitespace-nowrap">Verify Pincode:</label>
                <input
                  type="text"
                  maxLength={6}
                  value={inspectPincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setInspectPincode(val);
                    if (val.length === 6) fetchCourierInfo(val);
                  }}
                  className="input min-h-[36px] py-1 px-2.5 text-caption font-mono w-28 text-center"
                  placeholder="400001"
                />
                <button
                  type="button"
                  onClick={() => fetchCourierInfo(inspectPincode)}
                  disabled={inspectPincode.length !== 6}
                  className="btn-secondary min-h-[36px] px-3 text-caption py-1 font-medium disabled:opacity-40"
                >
                  Verify
                </button>
              </div>

              {courierInfo ? (
                <div className="space-y-2.5 text-body-sm pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-caption">
                    <div className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${courierInfo.couriers?.some((c) => c.includes('DTDC')) ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <span>DTDC Express</span>
                      </div>
                      <span className="font-semibold text-emerald-800">
                        {courierInfo.couriers?.some((c) => c.includes('DTDC')) ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>

                    <div className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${courierInfo.couriers?.some((c) => c.includes('Professional')) ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <span>Professional Courier</span>
                      </div>
                      <span className="font-semibold text-emerald-800">
                        {courierInfo.couriers?.some((c) => c.includes('Professional')) ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-caption text-neutral-700 pt-1 border-t border-neutral-100">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      Estimated Transit: <strong>{courierInfo.estimatedDays || '3-5 Business Days'}</strong>
                    </span>
                    <span className="text-emerald-700 font-medium">Ready for Dispatch</span>
                  </div>
                </div>
              ) : (
                <p className="text-caption text-neutral-500 italic">
                  Checking courier serviceability for PIN {inspectPincode}...
                </p>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <span className="overline text-neutral-500 block">Order Line Items</span>
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white">
                {selectedOrder.lineItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                      <OptimizedImage src={item.image} alt={item.title} width={48} height={48} objectFit="cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-neutral-950 truncate">{item.title}</p>
                      {item.variantTitle && item.variantTitle !== 'Default Title' && (
                        <p className="text-caption text-neutral-500">{item.variantTitle}</p>
                      )}
                      <p className="text-caption text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-neutral-950 text-cream-50 rounded-xl">
              <span className="text-body-sm font-medium text-cream-50/80">Total Order Amount</span>
              <span className="font-heading text-heading-lg text-cream-50">
                {formatMoney(selectedOrder.total, selectedOrder.currencyCode as 'INR' | 'USD')}
              </span>
            </div>

            {/* Update Status Actions */}
            <div className="space-y-2 pt-2">
              <span className="overline text-neutral-500 block">Update Order Status</span>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_STATUSES.map((st) => {
                  const isCurrent = selectedOrder.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingStatus || isCurrent}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`h-11 px-3 rounded-lg text-caption font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-neutral-950 text-cream-50 cursor-default ring-2 ring-gold-400/50'
                          : 'bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-950'
                      }`}
                    >
                      {isCurrent && <Check className="h-3.5 w-3.5 text-gold-400" />}
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)} disabled={updatingStatus}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}