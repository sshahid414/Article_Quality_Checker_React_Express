import type { ParsedArticle, UploadPayload, UploadResult } from '../types.js';

export async function uploadToWordPress(article: ParsedArticle): Promise<UploadResult> {
  const payload: UploadPayload = {
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    articleTitle: article.articleTitle,
    articleHtml: article.articleHtml,
    platform: 'wordpress',
  };

  // Placeholder automation — in production this would call the WordPress REST API
  console.log('[WordPress Upload] Payload prepared:', {
    metaTitle: payload.metaTitle,
    metaDescription: payload.metaDescription.slice(0, 80) + '...',
    articleTitle: payload.articleTitle,
    htmlLength: payload.articleHtml.length,
  });

  await simulateNetworkDelay();

  return {
    success: true,
    message: 'Article queued for WordPress upload (placeholder automation).',
    platform: 'wordpress',
    payload,
    timestamp: new Date().toISOString(),
  };
}

export async function uploadToShopify(article: ParsedArticle): Promise<UploadResult> {
  const payload: UploadPayload = {
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    articleTitle: article.articleTitle,
    articleHtml: article.articleHtml,
    platform: 'shopify',
  };

  console.log('[Shopify Upload] Payload prepared:', {
    metaTitle: payload.metaTitle,
    articleTitle: payload.articleTitle,
    htmlLength: payload.articleHtml.length,
  });

  await simulateNetworkDelay();

  return {
    success: true,
    message: 'Article queued for Shopify blog upload (placeholder automation).',
    platform: 'shopify',
    payload,
    timestamp: new Date().toISOString(),
  };
}

function simulateNetworkDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 800));
}
