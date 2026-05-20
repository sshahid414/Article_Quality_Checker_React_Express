/**
 * Prefixes Google Doc export selectors so global rules (p, h1, li, …)
 * do not override the app UI outside the article preview.
 */
export function scopeDocStyles(css: string, scope = '.doc-content'): string {
  const parts: string[] = [];
  let i = 0;

  while (i < css.length) {
    const brace = css.indexOf('{', i);
    if (brace === -1) {
      parts.push(css.slice(i));
      break;
    }

    const selectors = css.slice(i, brace).trim();
    const close = css.indexOf('}', brace);
    if (close === -1) {
      parts.push(css.slice(i));
      break;
    }

    const block = css.slice(brace, close + 1);

    if (selectors.startsWith('@')) {
      parts.push(selectors, block);
    } else {
      const scoped = selectors
        .split(',')
        .map((raw) => {
          const sel = raw.trim();
          return sel ? `${scope} ${sel}` : sel;
        })
        .join(', ');
      parts.push(scoped, block);
    }

    i = close + 1;
  }

  return parts.join('');
}
