'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-cream-50">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-display-sm tracking-tight text-neutral-950 mb-3">
          Something went wrong
        </h1>
        <p className="text-body text-neutral-600 mb-8">
          We encountered an unexpected error while loading this section. Please try refreshing or return to the store homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
