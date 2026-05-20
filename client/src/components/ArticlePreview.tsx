import { scopeDocStyles } from '../utils/scopeDocStyles';

interface Props {
  html: string;
  css?: string;
}

export function ArticlePreview({ html, css }: Props) {
  const scopedCss = css ? scopeDocStyles(css) : undefined;
  return (
    <section className="w-full rounded-xl border border-border bg-surface px-6 py-5">
      <h2 className="mb-2 text-[1.05rem] font-semibold text-text">Article HTML Preview</h2>
      <p className="mb-4 text-sm text-text-muted">
        Cleaned article body ready for WordPress content field.
      </p>
      <div className="max-h-[500px] overflow-y-auto rounded-md bg-white p-8">
        {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}
        <div
          className="doc-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
