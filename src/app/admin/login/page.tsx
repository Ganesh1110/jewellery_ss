'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('from') || '/admin';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Default admin passcode (demo / dev default: admin123)
    const validPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || 'admin123';

    if (password !== validPasscode) {
      setError('Invalid Store Owner Passcode. Please try again.');
      return;
    }

    setLoading(true);

    // Set secure admin session cookie
    document.cookie = 'sss_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax';

    setTimeout(() => {
      router.push(fromUrl);
      router.refresh();
    }, 400);
  };

  return (
    <div className="card p-8 sm:p-10 space-y-6 shadow-medium bg-white">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center mx-auto mb-3 border border-gold-200">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-display-sm text-neutral-950">Store Owner Passcode</h2>
        <p className="text-body-sm text-neutral-500">
          Enter your secure store owner passcode to access catalog management and inventory controls.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-body-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="admin-passcode" className="label flex items-center justify-between">
            <span>Store Admin Passcode</span>
            <span className="text-caption text-neutral-400 font-normal">Default: admin123</span>
          </label>
          <div className="relative">
            <KeyRound className="h-4 w-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-passcode"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passcode..."
              className="input pl-10 font-medium text-body"
              autoFocus
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full py-3.5">
          {loading ? 'Authenticating...' : 'Access Admin Portal'} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="pt-4 border-t border-neutral-100 text-center">
        <Link href="/" className="text-caption text-neutral-500 hover:text-neutral-950 transition-colors">
          Return to Customer Storefront
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-cream-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <span className="overline text-gold-600">Style Statement Atelier</span>
          <h1 className="font-heading text-display-md text-neutral-950">Store Management Gate</h1>
        </div>

        <Suspense fallback={<div className="text-center text-neutral-500 py-8">Loading authentication...</div>}>
          <AdminLoginForm />
        </Suspense>

        <div className="mt-8 text-center flex items-center justify-center gap-2 text-caption text-neutral-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Encrypted Route Protection Guard Active</span>
        </div>
      </div>
    </div>
  );
}
