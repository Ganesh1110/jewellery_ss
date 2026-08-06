'use client';

import { Star } from 'lucide-react';

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
    <section className="section" aria-labelledby="testimonials-heading">
      <div className="container">
        <header className="max-w-2xl mx-auto text-center mb-12 lg:mb-20">
          <span className="overline mb-3 inline-block">Customer Stories</span>
          <h2 id="testimonials-heading" className="font-heading text-display-sm sm:text-display-md tracking-tight text-neutral-950 mb-4">
            Worn and loved every day
          </h2>
          <div className="flex items-center justify-center gap-2 text-body-sm text-neutral-600">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-neutral-950 text-neutral-950" />
              ))}
            </div>
            <span>4.9 / 5.0 from over 1,200 verified reviews</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 lg:gap-x-12">
          {reviews.map((review) => (
            <article key={review.id} className="border-t border-neutral-950/10 pt-8 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-neutral-950 text-neutral-950" />
                  ))}
                </div>
                <h3 className="font-heading text-heading-md font-medium text-neutral-950 mb-3 italic">
                  &ldquo;{review.title}&rdquo;
                </h3>
                <p className="text-body-sm text-neutral-600 leading-relaxed">
                  {review.comment}
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-950/10">
                <p className="text-body-sm font-medium text-neutral-950">{review.name}, {review.location}</p>
                <p className="text-caption text-neutral-400 mt-0.5">{review.product} · Verified Buyer</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
