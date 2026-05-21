import * as cheerio from 'cheerio';
import type { ArticleImage, ArticleLink, ParsedArticle } from '../types.js';
import { DEFAULT_DOC_URL, QUALITY_THRESHOLDS } from '../types.js';
import {
  fetchArticleHtml,
  extractDocId,
  extractDriveFileId,
  isGoogleDriveUrl,
  isProductLink,
  normalizeText,
  unwrapGoogleRedirect,
  checkPublicAccess,
  getExportUrl,
  getDriveDirectViewUrl,
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

  $('a[href]').each((_, el) => {
    const anchor = $(el);
    const rawUrl = anchor.attr('href') ?? '';
    const url = unwrapGoogleRedirect(rawUrl);
    const text = normalizeText(anchor.text());

    if (!url || url.startsWith('#') || /^IMAGE\s+\d+$/i.test(text)) return;

    links.push({
      text: text || url,
      url,
      isProductLink: isProductLink(url),
    });
  });

  return links;
}

function imageUrlForEmbed(url: string): string {
  const direct = unwrapGoogleRedirect(url);
  if (isGoogleDriveUrl(direct)) {
    const fileId = extractDriveFileId(direct);
    if (fileId) return getDriveDirectViewUrl(fileId);
  }
  return direct;
}

function extractDocStyles($: cheerio.CheerioAPI): string {
  const parts: string[] = [];
  $('style').each((_, el) => {
    const content = $(el).html()?.trim();
    if (content) parts.push(content);
  });
  return parts.join('\n');
}

function buildCleanArticleHtml($: cheerio.CheerioAPI): string {
  const clone = cheerio.load($.html());

  clone('p').each((_, el) => {
    const paragraph = clone(el);
    const text = normalizeText(paragraph.text());

    if (/^Meta Title:/i.test(text) || /^Meta Description:/i.test(text)) {
      paragraph.remove();
      return;
    }

    const imageLink = paragraph.find('a').filter((__, anchor) => {
      const linkText = normalizeText(clone(anchor).text());
      return /^IMAGE\s+\d+$/i.test(linkText);
    }).first();

    if (!imageLink.length) return;

    const rawUrl = imageLink.attr('href') ?? '';
    const src = imageUrlForEmbed(rawUrl);
    const altMatch = text.match(/Alt tag:\s*[“"']?([^”"']+)[”"']?/i);
    const alt = altMatch ? normalizeText(altMatch[1]) : '';

    paragraph.html(
      `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`,
    );
  });

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
  const articleCss = extractDocStyles($);
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
    articleCss,
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
  ${article.articleCss ? `<style>\n${article.articleCss}\n</style>` : ''}
</head>
<body>
  <article>
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
