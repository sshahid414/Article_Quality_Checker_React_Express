import { Router } from 'express';
import { parseArticle } from '../services/articleParser.js';
import { uploadToWordPress, uploadToShopify } from '../services/uploadService.js';
import { DEFAULT_DOC_URL } from '../types.js';

export const articlesRouter = Router();

/**
 * Parse the article from the Google Doc
 * @param req - The request object
 * @param res - The response object
 * @returns The parsed article
 */
articlesRouter.post('/parse', async (req, res) => {
  try {
    const { docUrl } = req.body as { docUrl?: string };
    const article = await parseArticle(docUrl || DEFAULT_DOC_URL);
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to parse article' });
  }
});

/**
 * This is just placeholder for the actual upload to WordPress.
 * @param req - The request object
 * @param res - The response object
 * @returns The result of the upload
 */
articlesRouter.post('/upload/wordpress', async (req, res) => {
  try {
    const { docUrl } = req.body as { docUrl?: string };
    const article = await parseArticle(docUrl || DEFAULT_DOC_URL);

    if (!article.canUpload) {
      res.status(400).json({
        error: 'Article has failing quality checks. Fix issues before uploading.',
        qualityChecks: article.qualityChecks.filter((c) => c.status === 'fail'),
      });
      return;
    }

    const result = await uploadToWordPress(article);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
  }
});

/**
 * This is just placeholder for the actual upload to Shopify.
 * @param req - The request object
 * @param res - The response object
 * @returns The result of the upload
 */
articlesRouter.post('/upload/shopify', async (req, res) => {
  try {
    const { docUrl } = req.body as { docUrl?: string };
    const article = await parseArticle(docUrl || DEFAULT_DOC_URL);

    if (!article.canUpload) {
      res.status(400).json({
        error: 'Article has failing quality checks. Fix issues before uploading.',
        qualityChecks: article.qualityChecks.filter((c) => c.status === 'fail'),
      });
      return;
    }

    const result = await uploadToShopify(article);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
  }
});
