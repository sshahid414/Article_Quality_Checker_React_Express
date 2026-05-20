import type { ArticleImage, ArticleLink } from '../types';

interface Props {
  images: ArticleImage[];
  productLinks: ArticleLink[];
}

const tagClass = 'rounded-full px-2 py-0.5 text-[0.68rem] font-semibold';

export function ResourcesPanel({ images, productLinks }: Props) {
  return (
    <section className="w-full rounded-xl border border-border bg-surface px-6 py-5 h-full">
      <h2 className="mb-2 text-[1.05rem] font-semibold">Images & Links</h2>

      <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1 h-full">
        <div>
          <h3 className="mb-3 text-sm text-text-muted">Images ({images.length})</h3>
          {images.length === 0 ? (
            <p className="text-sm text-text-muted">No images found.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2.5 overflow-y-auto">
              {images.map((img) => (
                <li
                  key={img.label}
                  className="rounded-md border border-border bg-surface-2 p-3 text-sm"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <strong>{img.label}</strong>
                    <div className="flex shrink-0 gap-1.5">
                      {img.isGoogleDrive ? (
                        <span className={`${tagClass} bg-pass-bg text-pass`}>Google Drive</span>
                      ) : (
                        <span className={`${tagClass} bg-fail-bg text-fail`}>Not Drive</span>
                      )}
                      {img.isPubliclyAccessible === true && (
                        <span className={`${tagClass} bg-pass-bg text-pass`}>Public</span>
                      )}
                      {img.isPubliclyAccessible === false && (
                        <span className={`${tagClass} bg-warn-bg text-warn`}>Private?</span>
                      )}
                    </div>
                  </div>
                  <p className="mb-1 text-xs text-text-muted">Alt: {img.altTag || '—'}</p>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all font-mono text-[0.72rem] text-accent-hover"
                  >
                    {img.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm text-text-muted">Product Links ({productLinks.length})</h3>
          {productLinks.length === 0 ? (
            <p className="text-sm text-text-muted">No product links found.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2.5 overflow-y-auto">
              {productLinks.map((link, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm"
                >
                  <strong>{link.text}</strong>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all font-mono text-[0.72rem] text-accent-hover"
                  >
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
