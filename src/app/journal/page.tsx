import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/Image';
import { fetchBlogs, fetchArticles } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Editorial stories on fine jewelry, gemstones, craftsmanship, and style from the Style Statement by Shakthi atelier in Mumbai.',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function JournalPage() {
  const blogs = await fetchBlogs(5);
  const blog = blogs[0];
  const articleConnection = blog ? await fetchArticles(blog.handle, 12) : null;
  const articles = articleConnection?.edges.map(({ node }) => node) || [];

  return (
    <div className="flex flex-col">
      <header className="section-sm bg-white border-b border-neutral-950/10">
        <div className="container">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">Journal</span>
          </nav>
          <span className="overline mb-3 block">From the Atelier</span>
          <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-4">
            The Style Statement by Shakthi Journal
          </h1>
          <p className="text-body-lg text-neutral-600 max-w-2xl">
            Stories on jewelry, craft, and the collectors who live with it. Written by our atelier and editorial team in Mumbai.
          </p>
        </div>
      </header>

      <section className="section" aria-label="Journal articles">
        <div className="container">
          {articles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-body text-neutral-500">No journal entries yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {articles.map((article) => (
                <article key={article.id} className="group">
                  <Link href={`/journal/${article.handle}`} className="block" aria-label={article.title} data-testid="journal-article-link">
                    <div className="relative aspect-16-9 overflow-hidden bg-cream-100">
                      {article.image ? (
                        <OptimizedImage
                          src={article.image.url}
                          alt={article.image.altText || article.title}
                          fill
                          className="transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                          {article.title[0]}
                        </div>
                      )}
                    </div>
                    <div className="pt-5">
                      <p className="text-caption text-neutral-500 mb-3">
                        {formatDate(article.publishedAt)}
                        {article.author?.name ? ` · ${article.author.name}` : ''}
                      </p>
                      <h2 className="font-heading text-heading-md tracking-tight text-neutral-950 mb-2">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-body-sm text-neutral-600 mb-4 line-clamp-3">{article.excerpt}</p>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-950">
                        Read More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}