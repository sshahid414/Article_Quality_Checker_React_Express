import * as cheerio from 'cheerio';
import type { ArticleImage, ArticleLink, ParsedArticle } from '../types.js';
import { DEFAULT_DOC_URL, QUALITY_THRESHOLDS } from '../types.js';
import {
  fetchArticleHtml,
  extractDocId,
  isGoogleDriveUrl,
  isProductLink,
  normalizeText,
  unwrapGoogleRedirect,
  checkPublicAccess,
  getExportUrl,
} from '../utils/googleDocs.js';
import { runQualityChecks } from './qualityChecker.js';

function extractMetaField(cheerioResult: cheerio.CheerioAPI, label: string): string {
  let value = '';

  cheerioResult('p').each((_, el) => {
    const text = normalizeText(cheerioResult(el).text());
    if (text.toLowerCase().startsWith(`${label.toLowerCase()}:`)) {
      value = normalizeText(text.slice(label.length + 1));
      return false;
    }
  });

  return value;
}

function extractArticleTitle(cheerioResult: cheerio.CheerioAPI): string {
  const h1 = cheerioResult('h1').first().text();
  return normalizeText(h1);
}

function extractImages(cheerioResult: cheerio.CheerioAPI): Omit<ArticleImage, 'isPubliclyAccessible'>[] {
  const images: Omit<ArticleImage, 'isPubliclyAccessible'>[] = [];

  cheerioResult('p').each((_, el) => {
    const paragraph = cheerioResult(el);
    const text = normalizeText(paragraph.text());

    const imageLink = paragraph.find('a').filter((__, anchor) => {
      const linkText = normalizeText(cheerioResult(anchor).text());
      return /^IMAGE\s+\d+$/i.test(linkText);
    }).first();

    if (!imageLink.length) return;

    const label = normalizeText(imageLink.text());
    const rawUrl = imageLink.attr('href') ?? '';
    const url = unwrapGoogleRedirect(rawUrl);

    const altMatch = text.match(/Alt tag:\s*[“"']?([^”"']+)[”"']?/i);
    const altTag = altMatch ? normalizeText(altMatch[1]) : '';

    images.push({
      label,
      url,
      altTag,
      isGoogleDrive: isGoogleDriveUrl(url),
    });
  });

  return images;
}

function extractLinks(cheerioResult: cheerio.CheerioAPI): ArticleLink[] {
  const links: ArticleLink[] = [];
  const seen = new Set<string>();

  cheerioResult('a[href]').each((_, el) => {
    const anchor = cheerioResult(el);
    const rawUrl = anchor.attr('href') ?? '';
    const url = unwrapGoogleRedirect(rawUrl);
    const text = normalizeText(anchor.text());

    if (!url || url.startsWith('#') || /^IMAGE\s+\d+$/i.test(text)) return;

    const key = `${url}::${text}`;
    if (seen.has(key)) return;
    seen.add(key);

    links.push({
      text: text || url,
      url,
      isProductLink: isProductLink(url),
    });
  });

  return links;
}

function buildCleanArticleHtml(cheerioResult: cheerio.CheerioAPI): string {
  const clone = cheerio.load(cheerioResult.html());

  clone('p').each((_, el) => {
    const paragraph = clone(el);
    const text = normalizeText(paragraph.text());

    if (/^Meta Title:/i.test(text) || /^Meta Description:/i.test(text)) {
      paragraph.remove();
    }
  });

  clone('style').remove();

  const body = clone('.doc-content').length ? clone('.doc-content') : clone('body');
  return body.html()?.trim() ?? '';
}

export async function parseArticle(docIdOrUrl: string = DEFAULT_DOC_URL): Promise<ParsedArticle> {
  const sourceUrl = extractDocId(docIdOrUrl)
    ? getExportUrl(docIdOrUrl)
    : docIdOrUrl;

  const rawHtml = await fetchArticleHtml(docIdOrUrl);
  const cheerioResult = cheerio.load(rawHtml);

  const metaTitle = extractMetaField(cheerioResult, 'Meta Title');
  const metaDescription = extractMetaField(cheerioResult, 'Meta Description');
  const articleTitle = extractArticleTitle(cheerioResult);
  const articleHtml = buildCleanArticleHtml(cheerioResult);

  const rawImages = extractImages(cheerioResult);
  const images: ArticleImage[] = await Promise.all(
    rawImages.map(async (img) => ({
      ...img,
      isPubliclyAccessible: img.isGoogleDrive ? await checkPublicAccess(img.url) : null,
    }))
  );

  const links = extractLinks(cheerioResult);
  const productLinks = links.filter((link) => link.isProductLink);

  const qualityChecks = runQualityChecks({
    metaTitle,
    metaDescription,
    articleTitle,
    articleHtml,
    images,
    productLinks,
  });

  const canUpload = !qualityChecks.some((check) => check.status === 'fail');

  return {
    sourceUrl,
    metaTitle,
    metaDescription,
    articleTitle,
    articleHtml,
    images,
    links,
    productLinks,
    qualityChecks,
    canUpload,
  };
}

export function buildWordPressHtml(article: ParsedArticle): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.metaTitle || article.articleTitle)}</title>
  <meta name="description" content="${escapeHtml(article.metaDescription)}">
</head>
<body>
  <article>
    <h1>${escapeHtml(article.articleTitle)}</h1>
    ${article.articleHtml}
  </article>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
