import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/Image';
import { fetchBlogs, fetchArticles, fetchArticle } from '@/lib/shopify';

interface ArticlePageProps {
  params: Promise<{ handle: string }>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : (params as { handle: string });
  const handle = resolvedParams?.handle;
  const blogs = await fetchBlogs(1);
  const blog = blogs[0];
  const article = blog && handle ? await fetchArticle(blog.handle, handle) : null;
  if (!article) {
    return { title: 'Article Not Found' };
  }
  return {
    title: article.title,
    description: article.excerpt || `Read "${article.title}" on the Style Statement by Shakthi Journal.`,
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      type: 'article',
      images: article.image ? [{ url: article.image.url }] : [],
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { handle } = await params;
  const blogs = await fetchBlogs(1);
  const blog = blogs[0];
  const article = blog ? await fetchArticle(blog.handle, handle) : null;

  if (!article) {
    notFound();
  }

  const relatedArticles = (await fetchArticles(article.blog.handle, 4)).edges
    .map(({ node }) => node)
    .filter((a) => a.handle !== article.handle)
    .slice(0, 3);

  return (
    <div className="flex flex-col">
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container-narrow">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/journal" className="hover:text-neutral-950 transition-colors">Journal</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium truncate">{article.title}</span>
          </nav>
          <p className="overline text-gold-600 mb-3">{article.blog.title}</p>
          <h1 className="font-heading text-display-md sm:text-display-lg tracking-tight text-neutral-950 mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-body-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {formatDate(article.publishedAt)}
            </span>
            {article.author?.name && (
              <span>By {article.author.name}</span>
            )}
          </div>
        </div>
      </header>

      {article.image && (
        <div className="relative aspect-16-9 bg-neutral-100 border-b border-neutral-200">
          <OptimizedImage
            src={article.image.url}
            alt={article.image.altText || article.title}
            fill
            priority
          />
        </div>
      )}

      <article className="section" aria-label="Article body">
        <div className="container-narrow">
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: article.contentHtml || `<p>${article.excerpt || ''}</p>` }}
          />
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <Link href="/journal" className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Journal
            </Link>
          </div>
        </div>
      </article>

      {relatedArticles.length > 0 && (
        <section className="section bg-white border-y border-neutral-200" aria-labelledby="related-heading">
          <div className="container">
            <header className="max-w-2xl mx-auto text-center mb-12">
              <h2 id="related-heading" className="font-heading text-display-md tracking-tight text-neutral-950 mb-4">
                Keep Reading
              </h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map((related) => (
                <article key={related.id} className="card-interactive group overflow-hidden">
                  <Link href={`/journal/${related.handle}`} className="block">
                    <div className="relative aspect-16-9 overflow-hidden bg-neutral-100">
                      {related.image ? (
                        <OptimizedImage
                          src={related.image.url}
                          alt={related.image.altText || related.title}
                          fill
                          className="transition-transform duration-700 ease-out-expo group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                          {related.title[0]}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading text-heading-sm tracking-tight text-neutral-950 group-hover:text-gold-600 transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}