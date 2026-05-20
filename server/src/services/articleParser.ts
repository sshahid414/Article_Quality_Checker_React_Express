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

function extractMetaField($: cheerio.CheerioAPI, label: string): string {
  let value = '';

  $('p').each((_, el) => {
    const text = normalizeText($(el).text());
    if (text.toLowerCase().startsWith(`${label.toLowerCase()}:`)) {
      value = normalizeText(text.slice(label.length + 1));
      return false;
    }
  });

  return value;
}

function extractArticleTitle($: cheerio.CheerioAPI): string {
  const h1 = $('h1').first().text();
  return normalizeText(h1);
}

function extractImages($: cheerio.CheerioAPI): Omit<ArticleImage, 'isPubliclyAccessible'>[] {
  const images: Omit<ArticleImage, 'isPubliclyAccessible'>[] = [];

  $('p').each((_, el) => {
    const paragraph = $(el);
    const text = normalizeText(paragraph.text());

    const imageLink = paragraph.find('a').filter((__, anchor) => {
      const linkText = normalizeText($(anchor).text());
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

function extractLinks($: cheerio.CheerioAPI): ArticleLink[] {
  const links: ArticleLink[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, el) => {
    const anchor = $(el);
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

function buildCleanArticleHtml($: cheerio.CheerioAPI): string {
  const clone = cheerio.load($.html());

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
  const $ = cheerio.load(rawHtml);

  const metaTitle = extractMetaField($, 'Meta Title');
  const metaDescription = extractMetaField($, 'Meta Description');
  const articleTitle = extractArticleTitle($);
  const articleHtml = buildCleanArticleHtml($);

  const rawImages = extractImages($);
  const images: ArticleImage[] = await Promise.all(
    rawImages.map(async (img) => ({
      ...img,
      isPubliclyAccessible: img.isGoogleDrive ? await checkPublicAccess(img.url) : null,
    }))
  );

  const links = extractLinks($);
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
