import { Metadata } from 'next';
import Link from 'next/link';
import type { ElementType } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Style Statement by Shakthi team. We are here to help with orders, sizing, care, and bespoke commissions.',
};

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <header className="section-sm bg-white border-b border-neutral-950/10">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">Contact</span>
          </nav>
          <span className="overline mb-3 block">We&apos;d love to hear from you</span>
          <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-4">Contact Us</h1>
          <p className="text-body-lg text-neutral-600 max-w-2xl">
            Questions about a piece, sizing, shipping, or a bespoke commission? Our consultants reply within one business day.
          </p>
        </div>
      </header>

      <section className="section" aria-label="Contact details and form">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Contact details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-5">
                <ContactRow icon={Mail} label="Email" value="hello@sss.com" href="mailto:hello@sss.com" />
                <ContactRow icon={Phone} label="Phone" value="+91 22 4000 0000" href="tel:+912240000000" />
                <ContactRow icon={MapPin} label="Atelier" value="95 Mullin-Bazaar Road, Colaba, Mumbai, Maharashtra 400005" />
                <ContactRow icon={Clock} label="Hours" value="Mon–Fri, 10am–6pm IST" />
              </div>
              <div className="border border-neutral-950/10 p-6">
                <h2 className="font-heading text-heading-md text-neutral-950 mb-2">Bespoke Commissions</h2>
                <p className="text-body-sm text-neutral-600">
                  Dreaming of something one-of-a-kind? Tell us about the piece you have in mind and our studio will craft it with you.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex-shrink-0 w-5 mt-0.5 text-neutral-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-caption text-neutral-500 uppercase tracking-[0.16em]">{label}</p>
        {href ? (
          <a href={href} className="text-body text-neutral-950 hover:text-neutral-500 transition-colors">{value}</a>
        ) : (
          <p className="text-body text-neutral-950">{value}</p>
        )}
      </div>
    </>
  );
  return <div className="flex items-start gap-4">{content}</div>;
}