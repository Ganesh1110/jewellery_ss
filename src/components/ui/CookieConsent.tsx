'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'sss_cookie_consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a slight delay for smooth entry
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'granted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'denied');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up"
    >
      <div className="card p-5 sm:p-6 shadow-strong border border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 text-gold-700">
            <Cookie className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span className="font-heading text-body font-semibold text-neutral-950">We value your privacy</span>
          </div>
          <button
            onClick={handleDecline}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Close cookie consent banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-body-sm text-neutral-600 mb-5 leading-relaxed">
          We use cookies to enhance your browsing experience, deliver personalized recommendations, and analyze site performance. Read our{' '}
          <Link href="/privacy-policy" className="underline underline-offset-2 text-neutral-950 hover:text-gold-600 transition-colors">
            Privacy Policy
          </Link>.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAccept}
            className="btn-primary text-body-sm py-2 px-4 flex-1 text-center"
          >
            Accept All
          </button>
          <button
            onClick={handleDecline}
            className="btn-secondary text-body-sm py-2 px-4 flex-1 text-center"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
