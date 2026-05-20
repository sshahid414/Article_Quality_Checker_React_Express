import { useState, useCallback } from 'react';
import type { ParsedArticle, UploadResult } from './types';
import { DEFAULT_DOC_URL } from './types';
import { QualityPanel } from './components/QualityPanel';
import { ArticleDetails } from './components/ArticleDetails';
import { ResourcesPanel } from './components/ResourcesPanel';
import { ArticlePreview } from './components/ArticlePreview';

const panelClass =
  'w-full rounded-xl border border-border bg-surface px-6 py-5';

export default function App() {
  const [docUrl, setDocUrl] = useState(DEFAULT_DOC_URL);
  const [article, setArticle] = useState<ParsedArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      const res = await fetch('/api/articles/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to parse article');
      }

      const data: ParsedArticle = await res.json();
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }, [docUrl]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface px-8 py-6 max-[600px]:px-4 max-[600px]:py-4">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl font-bold text-text">Article Quality Checker</h1>
            <p className="mt-1 text-sm text-text-muted">
              Parse Google Docs, validate SEO quality, and upload to WordPress or Shopify
            </p>
          </div>
          <div className={panelClass}>
            <h2 className="mb-2 text-[1.05rem] font-semibold text-text">Google Doc Source</h2>
            <div className="flex gap-3 max-[900px]:flex-col">
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="Paste Google Doc URL..."
              />
              <button
                className="whitespace-nowrap bg-accent px-5 py-2.5 text-white hover:bg-accent-hover disabled:hover:bg-accent"
                onClick={parseArticle}
                disabled={loading}
              >
                {loading ? 'Parsing...' : 'Parse & Check'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1780px] flex-col gap-5 px-8 py-6 pb-12 max-[600px]:px-4 max-[600px]:py-4">
        {error && (
          <div className="rounded-md border border-fail/30 bg-fail-bg px-5 py-3.5 text-sm text-fail">
            {error}
          </div>
        )}

        {article && (
          <>
            {uploadResult && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-pass/30 bg-pass-bg px-5 py-3.5 text-sm text-pass">
                <span>
                  <strong>{uploadResult.platform}:</strong> {uploadResult.message}
                </span>
                <span className="text-xs opacity-80">
                  {new Date(uploadResult.timestamp).toLocaleString()}
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1">
              <div className='col-span-2'>
                <ArticlePreview html={article.articleHtml} css={article.articleCss} />
              </div>
              <ArticleDetails article={article} />
            </div>
            <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
              <QualityPanel checks={article.qualityChecks} canUpload={article.canUpload} />
              <ResourcesPanel images={article.images} productLinks={article.productLinks} />
            </div>
          </>
        )}

        {!article && !loading && !error && (
          <div className="px-12 py-12 text-center text-text-muted">
            <p>
              Click <strong>Parse & Check</strong> to load the sample article and run quality validation.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
