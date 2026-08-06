import { Metadata } from 'next';
import Link from 'next/link';
import { Gem, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/Image';
import { fetchShop } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'The story of Style Statement by Shakthi — handcrafted fine jewelry with intention, founded in Mumbai. Learn about our craft, our artisans, and our promise.',
};

const values = [
  { icon: Gem, title: 'Craft', text: 'Every piece is designed in-house and handcrafted by master artisans using time-honoured techniques.' },
  { icon: Sparkles, title: 'Intention', text: 'Each design begins with a story — a memory, a milestone, a moment worth keeping.' },
  { icon: Shield, title: 'Integrity', text: 'We use only ethically sourced diamonds, certified gemstones, and recycled precious metals.' },
];

export default async function AboutPage() {
  const shop = await fetchShop();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="section bg-white border-b border-neutral-200" aria-labelledby="about-title">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">Our Story</span>
          </nav>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative aspect-4-5 overflow-hidden">
              <OptimizedImage
                src={shop.brand?.coverImage?.url || '/brand-story.svg'}
                alt="Style Statement by Shakthi atelier"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div>
              <span className="overline text-gold-600 mb-3 inline-block">Our Story</span>
              <h1 id="about-title" className="font-heading text-display-lg tracking-tight text-neutral-950 mb-6">
                Crafted with Intention, Rooted in Mumbai
              </h1>
              <p className="text-body-lg text-neutral-600 mb-6">
                {shop.brand?.shortDescription || 'Founded in Mumbai, Style Statement by Shakthi began with a simple belief: jewelry should be more than adornment. It should be a reflection of your journey.'}
              </p>
              <p className="text-body text-neutral-600 mb-6">
                What started as a small family atelier has grown into a studio of master craftspeople — each with decades of experience in goldsmithing, stone-setting, and engraving. We still do things the slow way, because jewelry meant to be an heirloom deserves nothing less.
              </p>
              <p className="text-body text-neutral-600 mb-8">
                Every piece is finished by hand, inspected against exacting standards, and shipped in a keepsake box designed to be passed down with the piece itself.
              </p>
              <Link href="/collections" className="btn-primary inline-flex items-center gap-2">
                Explore the Collection <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" aria-labelledby="values-heading">
        <div className="container">
          <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
            <span className="overline text-gold-600 mb-3 inline-block">What We Stand For</span>
            <h2 id="values-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-4">
              The Style Statement by Shakthi Promise
            </h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
              <article key={value.title} className="card p-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-100 text-gold-700 mb-5">
                  <value.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-heading-md text-neutral-950 mb-3">{value.title}</h3>
                <p className="text-body-sm text-neutral-600">{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-neutral-950 text-cream-50" aria-labelledby="cta-heading">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 id="cta-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight mb-4">
              Find a Piece That Tells Your Story
            </h2>
            <p className="text-body-lg text-cream-50/70 mb-8">
              Browse our collections, or reach out — our consultants would be happy to help you choose something meaningful.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/collections" className="btn-gold">Shop Collections</Link>
              <Link href="/contact" className="btn-secondary !text-cream-50 !border-neutral-600 hover:!bg-neutral-900">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}