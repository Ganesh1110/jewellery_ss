'use client';

import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: 'Ananya R.',
    location: 'Mumbai',
    rating: 5,
    title: 'Exquisite Craftsmanship',
    comment: 'The attention to detail and weight of the gold finish is unmatched. Truly feels like a heirloom piece passed down through generations.',
    product: 'Solitaire Statement Ring',
  },
  {
    id: 2,
    name: 'Priya K.',
    location: 'Bengaluru',
    rating: 5,
    title: 'Stunning Presentation',
    comment: 'From the luxury gift packaging to the handwritten note, opening my order was an experience in itself. Highly recommended!',
    product: 'Celestial Diamond Pendant',
  },
  {
    id: 3,
    name: 'Meera S.',
    location: 'Delhi',
    rating: 5,
    title: 'Timeless Elegance',
    comment: 'I wear my Style Statement necklace daily. It pairs effortlessly with both formal saris and contemporary Western wear.',
    product: 'Artisanal Gold Cuff',
  },
];

export function Testimonials() {
  return (
    <section className="section bg-white border-y border-neutral-200/80" aria-labelledby="testimonials-heading">
      <div className="container">
        <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
          <span className="overline mb-3 inline-block">Customer Stories</span>
          <h2 id="testimonials-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-3">
            What Collectors Are Saying
          </h2>
          <div className="flex items-center justify-center gap-2 text-gold-500 font-medium text-body-sm">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />
              ))}
            </div>
            <span>4.9 / 5.0 rating based on over 1,200+ verified customer reviews</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {reviews.map((review) => (
            <article key={review.id} className="card p-6 sm:p-8 flex flex-col justify-between relative">
              <Quote className="h-8 w-8 text-gold-100 absolute top-6 right-6" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-1 mb-4 text-gold-500">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-500" />
                  ))}
                </div>
                <h3 className="font-heading text-heading-sm font-semibold text-neutral-950 mb-2">
                  &ldquo;{review.title}&rdquo;
                </h3>
                <p className="text-body-sm text-neutral-600 leading-relaxed mb-6">
                  {review.comment}
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-100 flex justify-between items-end">
                <div>
                  <p className="text-body-sm font-semibold text-neutral-950">{review.name}</p>
                  <p className="text-caption text-neutral-400">{review.location} &bull; Verified Buyer</p>
                </div>
                <span className="text-caption text-gold-600 font-medium">{review.product}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
