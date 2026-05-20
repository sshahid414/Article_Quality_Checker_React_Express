interface Props {
  html: string;
}

export function ArticlePreview({ html }: Props) {
  return (
    <section className="w-full rounded-xl border border-border bg-surface px-6 py-5">
      <h2 className="mb-2 text-[1.05rem] font-semibold">Article HTML Preview</h2>
      <p className="mb-4 text-sm text-text-muted">
        Cleaned article body ready for WordPress content field.
      </p>
      <div
        className="prose prose-sm max-h-[500px] max-w-none overflow-y-auto rounded-md bg-white p-8 text-[0.9rem] leading-relaxed text-neutral-900 prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:mb-3 prose-a:text-blue-600 prose-ul:my-2 prose-ol:my-2 prose-table:my-4 prose-td:border prose-td:border-neutral-300 prose-td:p-2 prose-th:border prose-th:border-neutral-300 prose-th:p-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
