'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Store, KeyRound, Palette, Bell, Info, Check } from 'lucide-react';

interface ConfigRow {
  key: string;
  label: string;
  value: string;
  hint: string;
}

const STORE_SETTINGS_KEY = 'sss_store_settings';

const DEFAULT_CONFIG: ConfigRow[] = [
  { key: 'store_name', label: 'Store Name', value: 'Style Statement by Shakthi', hint: 'Shown in the storefront header and metadata' },
  { key: 'store_email', label: 'Store Email', value: 'hello@sss.com', hint: 'Used for order notifications and contact form' },
  { key: 'currency', label: 'Currency', value: 'INR (₹)', hint: 'Currency for pricing and inventory valuation' },
  { key: 'free_shipping_threshold', label: 'Free Shipping Above', value: '₹15,000', hint: 'Complimentary shipping above this cart value' },
  { key: 'return_window', label: 'Return Window', value: '14 days', hint: 'Return period shown on the PDP and checkout' },
];

const DEFAULT_ALERTS = { lowStock: true, newOrder: true };

interface SavedSettings {
  config: ConfigRow[];
  alerts: { lowStock: boolean; newOrder: boolean };
}

function loadSettings(): SavedSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSettings;
    if (!Array.isArray(parsed.config) || !parsed.alerts) return null;
    return parsed;
  } catch (err) {
    console.error('Failed to parse store settings:', err);
    return null;
  }
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<ConfigRow[]>(DEFAULT_CONFIG);
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = loadSettings();
    if (existing) {
      setConfig(existing.config);
      setAlerts(existing.alerts);
    }
  }, []);

  const updateValue = (idx: number, value: string) => {
    setConfig((prev) => prev.map((row, i) => (i === idx ? { ...row, value } : row)));
  };

  const handleSave = () => {
    const payload: SavedSettings = { config, alerts };
    try {
      localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(payload));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save store settings:', err);
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
          <h1 className="font-heading text-display-md text-neutral-950">Store Settings</h1>
        </div>
      </header>

      <section className="section" aria-label="Store configuration">
        <div className="container max-w-3xl space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-4 w-4 text-gold-600" />
              <h2 className="font-heading text-heading-md text-neutral-950">General Store Details</h2>
            </div>
            <ul className="divide-y divide-neutral-950/10">
              {config.map((row, idx) => (
                <li key={row.key} className="py-4">
                  <label className="label" htmlFor={`config-${row.key}`}>{row.label}</label>
                  <input
                    id={`config-${row.key}`}
                    type="text"
                    value={row.value}
                    onChange={(e) => updateValue(idx, e.target.value)}
                    className="input text-body font-medium mt-2"
                  />
                  <p className="text-caption text-neutral-500 mt-1.5">{row.hint}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-4 w-4 text-gold-600" />
              <h2 className="font-heading text-heading-md text-neutral-950">Security & Access</h2>
            </div>
            <p className="text-body-sm text-neutral-600 mb-4">
              Admin access is protected by a passcode. Set it via the <code className="bg-neutral-100 rounded px-1.5 py-0.5 text-body-sm">NEXT_PUBLIC_ADMIN_PASSCODE</code> environment variable.
            </p>
            <div className="bg-neutral-50 border border-neutral-950/10 rounded-lg p-4 flex items-center gap-3">
              <Info className="h-4 w-4 text-neutral-400 flex-shrink-0" />
              <p className="text-body-sm text-neutral-600">
                Demo placeholder — enter your own passcode to restrict access to this suite.
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-gold-600" />
              <h2 className="font-heading text-heading-md text-neutral-950">Notifications</h2>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-body-sm font-medium text-neutral-950">Low stock alerts</p>
                <p className="text-caption text-neutral-500">Email me when stock falls to 3 units or fewer</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={alerts.lowStock}
                onClick={() => setAlerts((a) => ({ ...a, lowStock: !a.lowStock }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                  alerts.lowStock ? 'bg-neutral-950' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    alerts.lowStock ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-neutral-950/10">
              <div>
                <p className="text-body-sm font-medium text-neutral-950">New order notifications</p>
                <p className="text-caption text-neutral-500">Email me whenever a customer places an order</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={alerts.newOrder}
                onClick={() => setAlerts((a) => ({ ...a, newOrder: !a.newOrder }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                  alerts.newOrder ? 'bg-neutral-950' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    alerts.newOrder ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-gold-600" />
              <h2 className="font-heading text-heading-md text-neutral-950">Theme</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Light', 'Dark', 'System'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => undefined}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-neutral-950/10 text-body-sm text-neutral-700 hover:bg-neutral-100 transition-colors min-h-10"
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 flex items-center justify-between gap-4">
            <p className="text-body-sm text-neutral-500">
              Changes are stored locally in this browser and applied to the storefront demo.
            </p>
            <button type="button" onClick={handleSave} className="btn btn-primary min-h-11 px-6">
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}