import type { ParsedArticle } from '../types';

interface Props {
  article: ParsedArticle;
}

export function ArticleDetails({ article }: Props) {
  const handleUpload = async (platform: 'wordpress' | 'shopify') => {
    console.log('uploading', platform);
  };

  return (
    <section className="w-full rounded-xl border border-border bg-surface px-6 py-5">
      <h2 className="mb-2 text-[1.05rem] font-semibold">Extracted Fields</h2>
      <p className="mb-4 text-sm text-text-muted">
        WordPress-ready metadata and content separated for upload.
      </p>

      <div className="mb-5 flex flex-col gap-4">
        <Field label="Meta Title" value={article.metaTitle} />
        <Field label="Meta Description" value={article.metaDescription} />
        <Field label="Article Title" value={article.articleTitle} />
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <Stat label="Images" value={article.images.length} />
        <Stat label="Product Links" value={article.productLinks.length} />
        <Stat label="Total Links" value={article.links.length} />
      </div>
      <div className="flex justify-end">
        <button
          className="bg-wordpress px-6 py-3 text-white hover:bg-wordpress-hover disabled:hover:bg-wordpress"
          onClick={() => handleUpload('wordpress')}
          disabled={!article.canUpload}
        >
          Upload to WordPress
        </button>
        {!article.canUpload && (
          <p className="mt-3 text-sm text-text-muted">
            Resolve failing quality checks to enable upload.
          </p>
        )}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </label>
      <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm leading-normal">
        {value || <em className="text-text-muted">Not found</em>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4 text-center">
      <span className="block text-[1.75rem] font-bold text-accent-hover">{value}</span>
      <span className="text-[0.78rem] uppercase tracking-wide text-text-muted">{label}</span>
    </div>
  );
}
