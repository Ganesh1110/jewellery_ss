import Link from 'next/link';

export function PolicyPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container-narrow">
          <nav className="flex items-center gap-2 text-caption text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-950 font-medium">{title}</span>
          </nav>
          <h1 className="font-heading text-display-lg tracking-tight text-neutral-950 mb-2">{title}</h1>
          <p className="text-body-sm text-neutral-500">Last updated: {lastUpdated}</p>
        </div>
      </header>
      <article className="section">
        <div className="container-narrow prose prose-neutral max-w-none">
          {children}
        </div>
      </article>
    </div>
  );
}