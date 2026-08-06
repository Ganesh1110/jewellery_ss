'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 600);
  };

  if (status === 'success') {
    return (
      <div className="p-6 border border-cream-50/20 bg-neutral-900 text-center animate-fade-in space-y-3">
        <CheckCircle2 className="h-8 w-8 text-cream-50 mx-auto" />
        <h3 className="font-heading text-heading-md text-cream-50">Welcome to the Collective</h3>
        <p className="text-body-sm text-cream-50/70">
          Thank you for subscribing. We&apos;ve sent a welcome invitation to your inbox.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-caption uppercase tracking-[0.16em] text-cream-50/70 hover:underline pt-2 inline-block"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <label htmlFor="home-email" className="sr-only">Email address</label>
      <input
        type="email"
        id="home-email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        className="flex-1 bg-transparent border border-cream-50/25 text-cream-50 placeholder:text-cream-50/40 text-body-sm px-4 py-3 min-h-[46px] focus:border-cream-50 focus:outline-none transition-colors"
        required
      />
      <Button
        type="submit"
        disabled={status === 'submitting'}
        variant="secondary"
        className="whitespace-nowrap flex items-center justify-center gap-2 !border-cream-50/40 !text-cream-50 hover:!border-cream-50 hover:!bg-cream-50 hover:!text-neutral-950"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining…
          </>
        ) : (
          <>
            Subscribe <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
